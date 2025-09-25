import os
import sys
import time
import argparse
import platform
import subprocess as sp
import tempfile
import io
import contextlib

# Flask imports for API mode
from flask import Flask, request, jsonify
from flask_cors import CORS

# Setup paths
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_dir, "modules"))

# Imports from modules
from cparser import Parser
from scanner import Scanner, SymbolTableManager
from semantic_analyser import SemanticAnalyser
from code_gen import CodeGen, MemoryManager
from ir_to_armv8 import main as genARM

# Max virtual memory for program execution (in bytes)
MAX_VIRTUAL_MEMORY = 50 * 1024 * 1024  # 50 MB


def limit_virtual_memory():
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (MAX_VIRTUAL_MEMORY, MAX_VIRTUAL_MEMORY))


def compile_code(args):
    flag_lex = False
    flag_syn = False
    flag_sem = False
    print("Compiling", args.source_file)
    SymbolTableManager.init()
    MemoryManager.init()

    parser = Parser(args.source_file)

    start = time.time()
    parser.parse()
    elapsed = time.time() - start
    print(f"Compilation took {elapsed:.6f} s")

    # Save various outputs based on flags
    if args.abstract_syntax_tree:
        parser.save_parse_tree()
    if args.symbol_table:
        parser.scanner.save_symbol_table()
    if args.tokens:
        parser.scanner.save_tokens()
    if args.error_files:
        parser.save_syntax_errors()
        parser.scanner.save_lexical_errors()
        parser.semantic_analyzer.save_semantic_errors()

    parser.code_generator.save_output()

    # Collect errors
    lexical_errors = parser.scanner.lexical_errors.strip()
    syntax_errors = parser.syntax_errors.strip()
    semantic_errors = parser.semantic_analyzer.semantic_errors.strip()
    if lexical_errors != "There is no lexical errors.":
        flag_lex = True
    if syntax_errors != "There is no syntax error.":
        flag_syn = True
    if semantic_errors != "The input program is semantically correct.":
        flag_sem = True
    has_errors = bool(flag_lex or flag_sem or flag_syn)

    if has_errors:
        print("Compilation failed due to the following errors:\n")
        if lexical_errors:
            print("Lexical Errors:\n" + lexical_errors)
        if syntax_errors:
            print("Syntax Errors:\n" + syntax_errors)
        if semantic_errors:
            print("Semantic Errors:\n" + semantic_errors)

        # Save errors to ARM output file
        output_path = os.path.join(script_dir, "armv8_output.s")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            if lexical_errors:
                f.write("Lexical Errors:\n" + lexical_errors + "\n\n")
            if syntax_errors:
                f.write("Syntax Errors:\n" + syntax_errors + "\n\n")
            if semantic_errors:
                f.write("Semantic Errors:\n" + semantic_errors + "\n")
        return
    else:
        print("Compilation successful!")
        genARM()

    # Run the program if requested
    if args.run:
        print("Executing compiled program")
        plat = platform.system()

        # Choose the correct tester based on OS
        if plat == "Windows":
            tester_file = os.path.join(script_dir, "interpreter", "tester_Windows.exe")
        elif plat == "Linux":
            tester_file = os.path.join(script_dir, "interpreter", "tester_Linux.out")
        elif plat == "Darwin":
            tester_file = os.path.join(script_dir, "interpreter", "tester_Mac.out")
        else:
            raise RuntimeError("Unsupported operating system!")

        output_file = os.path.join(script_dir, "output", "output.txt")
        output_dir = os.path.dirname(output_file)

        if os.path.exists(output_file):
            preexec_fn = limit_virtual_memory if plat == "Linux" else None
            stderr = sp.PIPE if not args.verbose else None

            try:
                start = time.time()
                tester_output = sp.check_output(
                    tester_file,
                    cwd=output_dir,
                    stderr=stderr,
                    timeout=10,
                    preexec_fn=preexec_fn
                ).decode("utf-8")
                elapsed = time.time() - start
                if not args.verbose:
                    tester_output = "\n".join([
                        line.replace("PRINT", "").strip()
                        for line in tester_output.splitlines()
                        if line.startswith("PRINT")
                    ])
                print(f"Execution took {elapsed:.6f} s")
                print("Program output:")
                print(tester_output)
            except sp.TimeoutExpired:
                print("RuntimeError: Execution timed out!")


# -------------------------------
# Flask API setup
# -------------------------------
app = Flask(__name__)
CORS(app, origins=["https://crosscompiler.netlify.app"])  # allow your frontend


@app.route("/compiler", methods=["POST"])
def api_compile():
    try:
        data = request.get_json()
        code = data.get("code", "")

        # Save code to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".c", mode="w") as tmp:
            tmp.write(code)
            tmp.flush()
            source_path = tmp.name

        # Args class for compatibility
        class Args:
            def __init__(self, source_file):
                self.source_file = source_file
                self.run = False
                self.verbose = False
                self.error_files = False
                self.abstract_syntax_tree = False
                self.symbol_table = False
                self.tokens = False

        args = Args(source_path)

        # Capture stdout
        output_stream = io.StringIO()
        with contextlib.redirect_stdout(output_stream):
            compile_code(args)
        output = output_stream.getvalue()

        os.remove(source_path)

        return jsonify({"success": True, "output": output})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------
# Entry point: CLI or Server
# -------------------------------
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].endswith(".c"):
        parser = argparse.ArgumentParser(description="Simple C Compiler written in Python")
        parser.add_argument("source_file", help="Path to C source file.")
        parser.add_argument("-r", "--run", action="store_true", help="Run the output program after compilation.")
        parser.add_argument("-v", "--verbose", action="store_true", help="Print all used three address codes.")
        parser.add_argument("-ef", "--error-files", action="store_true", help="Save compilation errors to text files.")
        parser.add_argument("-ast", "--abstract-syntax-tree", action="store_true", help="Save abstract syntax tree into a text file.")
        parser.add_argument("-st", "--symbol-table", action="store_true", help="Save symbol table into a text file.")
        parser.add_argument("-t", "--tokens", action="store_true", help="Save lexed tokens into a text file.")

        args = parser.parse_args()

        if not os.path.isabs(args.source_file):
            args.source_file = os.path.abspath(args.source_file)

        compile_code(args)
    else:
        # Run Flask server (Render will start here)
        port = int(os.environ.get("PORT", 10000))
        app.run(host="0.0.0.0", port=port)
