.global _start
.section .text
_start:
MOV x0, #10008
MOV x1, x0
MOV x2, #4
SUB x3, x1, x2
MOV x4, #10
STR x4, [x3]
B LABEL_4
LABEL_4:
MOV x5, #1
MOV x1, x7
MOV x2, x5
ADD x6, x1, x2
MOV x8, x6
MOV x1, x0
MOV x2, #4
SUB x9, x1, x2
LDR x10, [x9]
LDR x11, [x10]
BR x11
