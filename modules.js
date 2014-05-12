//CONTAINS ALL THE MODULES REQUIRED IN THE PROCESSOR SIMULATOR
//////////////////////////////////////////////////////////////
"use strict";
//The brains
function processor() {
    this.instructionBlock = new INSTRUCTION();
    this.ALU = new ALU();
    this.ALUCONTROL = new ALUCONTROL();
    this.PC = new PC();
    this.MEMORY = new MEMORY();
    this.CONTROL = new Control();
    this.REGISTER = new Register();
    
    this.startInstructionAddress = "4194304";
    this.startMemoryAddress = "268435456";
}
processor.prototype.interface = function () {
    var InsBlock = document.getElementById("instructionBlock");
    var output = "<table cellpadding='5px' cellspacing='0' style='text-align:left;'><tr><td>Address</td><td>Hexadecimal</td><td>Instruction</td></tr>";
    for( var i = 0;i<this.instructionBlock.instructions.length;i++){
        var next = this.instructionBlock.instructions[i];
        var addr = new Hexadecimal();
        var insHex = new Hexadecimal();
        insHex.setBinaryValue(next[1]);
        addr.setValue((parseInt(this.startInstructionAddress,10)+i*4).toString(16));  
        if( i == this.instructionBlock.currentAddress ){
            output += "<tr class='currentAddress' style='color:red'>";
        } else {
            output += "<tr>"
        }
        output += "<td>0x"+addr.hexa+"</td><td>0x"+insHex.hexa+"</td><td>"+next[0]+"</td></tr>";
           
    }
    output += "<tr";
    if (this.instructionBlock.currentAddress== this.instructionBlock.instructions.length) {
        output += " style='color:red' ";
    }
    
    output+= "><td colspan='3'>END</td></tr></table>";
    InsBlock.innerHTML = output;
    
    var RegFile = document.getElementById("registerFile");
    output = "<table cellpadding='1px' cellspacing='0' style='text-align:left;'><tr><td>Reg</td><td>Value</td></tr>";
    for ( var i =0 ; i < 32;i++){
        var value = this.REGISTER['r'+i];
        output += "<tr id='r"+i+"'><td>$"+i+"</td><td>"+value+"</td></tr>";
    }
    output += "</table>";
    RegFile.innerHTML = output;
    
}
processor.prototype.operate = function () {
    var stepThrough = 0; // step 0
    var instruction = this.instructionBlock.getNext();
    
    if(instruction===undefined){
     //   this.instructionBlock.setAddress(0);
        this.interface();
    } else {
        //control block
        this.CONTROL.setOpCode(instruction[1].substr(0,6));
        this.REGISTER.regWrite(this.CONTROL.RegWrite);
        var RegDst = this.CONTROL.RegDst;
        var ALUSrc = this.CONTROL.ALUSrc;
        var MemToReg = this.CONTROL.MemtoReg;
        var Branch = this.CONTROL.Branch;
        var imm32 = signExtend(instruction[1].substr(16));
        this.ALUCONTROL.ALUOp0 = this.CONTROL.ALUOp0;
        this.ALUCONTROL.ALUOp1 = this.CONTROL.ALUOp1;
        this.MEMORY.setReadOrWrite(this.CONTROL.MemWrite,this.CONTROL.MemRead);

        //ALU Control
        this.ALUCONTROL.setFunct(instruction[1].substr(26));
        this.ALU.setControl(this.ALUCONTROL.ALUCONTROL);

        //regfile
        var writeReg = (this.CONTROL.RegWrite==="1")?MUX(RegDst,instruction[1].substr(11,5),instruction[1].substr(16,5),2):false;

        this.REGISTER.writeReg(MUX(RegDst,instruction[1].substr(11,5),instruction[1].substr(16,5),2));
        this.REGISTER.readRegister1(parseInt(instruction[1].substr(6,5),2));
        this.REGISTER.readRegister2(parseInt(instruction[1].substr(11,5),2));

        //ALU
        this.ALU.setInputA(this.REGISTER.readData1);
        this.ALU.setInputB(MUX(ALUSrc,this.REGISTER.readData2,imm32));
        var aluRes = this.ALU.output;

        //Branching
        var PCSrc = ANDFAN2(Branch,this.ALU.isZero);
        var Bin = new Binary();
        Bin.setValue(imm32);
        imm32 = Bin.getInt() + this.instructionBlock.currentAddress+1;
        var bta = (PCSrc=="1")?imm32:this.instructionBlock.currentAddress+1;
        //Memory
        this.MEMORY.setWriteData(this.REGISTER.readData2);
        this.MEMORY.setAddress(aluRes);

        //writeback
        this.REGISTER.writeData(MUX(MemToReg,aluRes,this.MEMORY.ReadData));

        //display changes

        this.instructionBlock.setAddress(bta);

        this.interface();
        if (writeReg){
            document.getElementById("r"+binToInt(writeReg)).style.color = "red";
        }
        
     var t = this;
  //  setTimeout(function() {t.operate();},1000);
    }
   // alert(instruction);
}
processor.prototype.loadInstructions = function (textarea) {
    //grab from textarea;
    var lines = textarea.value.split("\n");
    for(var i = 0; i < lines.length;i++){
        if( lines[i].trim().length > 0 ){
            //translate instruction to hexadecimal;
            // lw,sw,add,sub,and,or,beq
            // opcode rs rt rd shamt funct
            // add $1, $2, $3
            // 0 2 3 1 0 32
            
            //look out for labels;
            var opcode = lines[i].trim().split(" ")[0];
            var shamt = "00000";
            var rs = "00000";
            var rt = "00000";
            var rd = "00000";
            var funct = "000000";
            var imm = "0000000000000000";
            var format = 1; //R = 1 I = 2 Branch = 3
            
            switch(opcode){
                case "lw":
                    opcode = "100011";
                    format = 2;
                break;
                case "sw":
                    opcode = "101011";
                    format = 2;
                break;
                case "add":
                    opcode = "000000";
                    funct = "100000";
                break;
                case "sub":
                    opcode = "000000";
                    funct = "100010";
                break;                
                case "and":
                    opcode = "000000";
                    funct = "100100";
                break;
                case "or":
                    opcode = "000000";
                    funct = "100101";
                break;
                case "beq":
                    opcode = "000100"; 
                    format = 3;
                break;
                default:
                    format = 4;
                    //check for labels else print compile error;
                break;
            }
            if (format === 1){
                var re = /^.*\$(\d{1,2}).*\$(\d{1,2}).*\$(\d{1,2})$/;
                var myArray = lines[i].trim().match(re);
                rs = (rs+parseInt(myArray[2],10).toString(2)).slice(-5);
                rt = (rt+parseInt(myArray[3],10).toString(2)).slice(-5);
                rd = (rd+parseInt(myArray[1],10).toString(2)).slice(-5);  
                this.instructionBlock.addInstruction([lines[i], opcode+rs+rt+rd+"00000"+funct]);
            } else if (format===2) {
                var re = /^.*\$(\d{1,2})[ ,]*(\d{1,10})\(\$(\d{1,2})\)$/;
                var myArray = lines[i].trim().match(re);
                rs = (rs+parseInt(myArray[3],10).toString(2)).slice(-5);
                rd = (rd+parseInt(myArray[1],10).toString(2)).slice(-5);
                imm = (imm+parseInt(myArray[2],10).toString(2)).slice(-16);  
                this.instructionBlock.addInstruction([lines[i], opcode+rs+rd+imm]);
            } else if (format===3){
                var re = /^.*\$(\d{1,2}).*\$(\d{1,2})[ ,]*(\w*)$/;
                var myArray = lines[i].trim().match(re);
                rs = (rs+parseInt(myArray[1],10).toString(2)).slice(-5);
                rd = (rd+parseInt(myArray[2],10).toString(2)).slice(-5);
                for(var x = 0; x < lines.length;x++){
                    var re = new RegExp("^"+myArray[3]+":.*$")
                    if (re.exec(lines[x])!== null){
                        var immediate = new Binary();
                        immediate.setIntValue(x+1-(this.instructionBlock.instructions.length+2));
                        imm = (immediate.binary).slice(-16);
                        break;
                    }
                }
                this.instructionBlock.addInstruction([lines[i], opcode+rs+rd+imm]);
            }
        }
    }
    this.interface();
};



//ALU
//AND OR ADDER
function ALU() {
    this.control = "00";
    this.aInvert = "0";
    this.bInvert = "0";
    this.inputA = "";
    this.inputB = "";
    this.output = "";
    this.isZero = "0";
}
ALU.prototype.setControl = function (control) {
    this.aInvert = control.substr(0, 1);
    this.bInvert = control.substr(1, 1);
    this.control = control.substr(2);
};
ALU.prototype.setInputA = function (A) {
    this.inputA = A;
    if (this.inputB !== "") {
        this.operation();
    }
};
ALU.prototype.setInputB = function (B) {
    this.inputB = B;
    if (this.inputA !== "") {
        this.operation();
    }
};
ALU.prototype.operation = function () {
    this.isZero = "0";
    var a, b;
    if (this.aInvert === "0") {
        a = this.inputA;
    } else {
        a = invert(this.inputA);
        //a = FULLADDER("0",signExtendZero(a),signExtendZero("1"))[1];
    }
    if (this.bInvert === "0") {
        b = this.inputB;
    } else {
        b = invert(this.inputB);
        //b = FULLADDER("0",signExtendZero(b),signExtendZero("1"))[1];
    }
    switch (this.control) {
    case "00":
            //AND
        this.output = AND(a, b);
        break;
    case "01":
        //OR
        this.output = ORFAN2(a, b);
        break;
    case "10":
        //ADDER
        this.output = PARALLELADDER(ORFAN2(this.aInvert, this.bInvert), a, b)[1];
        break;
    }
    if (binToInt(this.output)==0) {
        this.isZero = "1";
    }
};

//ALUCONTROL
function ALUCONTROL() {
    this.ALUOp0;
    this.ALUOp1;
    //first 2 bits of funct is pointless don't care
    this.funct;
    //first bit always 0
    // lw   0010
    // sw   0010
    // beq  0110
    // add  0010
    // sub  0110
    // and  0000
    // or   0001
    // slt  0111
    this.ALUCONTROL = "0000";
}
ALUCONTROL.prototype.setALUOp1 = function (op1) {
    this.ALUOp1 = op1;
};
ALUCONTROL.prototype.setALUOp0 = function (op0) {
    this.ALUOp0 = op0;
}
ALUCONTROL.prototype.setFunct = function (funct) {
    this.funct = funct;
    this.generate();
};
ALUCONTROL.prototype.generate = function () {
    this.ALUCONTROL = "0";
    this.ALUCONTROL += ORFAN2(this.ALUOp0,ANDFAN2(this.ALUOp1, this.funct[4]));
    this.ALUCONTROL += ORFAN2(invert(this.funct[3]), invert(this.ALUOp1));
    this.ALUCONTROL += ANDFAN2(this.ALUOp1, ORFAN2(this.funct[5],this.funct[2]));
};

//INSTRUCTION
//CORE of everything
function INSTRUCTION() {
    this.instructions = new Array();
    this.startAddress = "4194304";
    this.currentAddress = 0; //offset from start
    this.addAddress = "0";
}
INSTRUCTION.prototype.addInstruction = function (instruction) {
    this.instructions[this.addAddress++] = instruction;
};
INSTRUCTION.prototype.setAddress = function (addr) {
    this.currentAddress = addr;
}
INSTRUCTION.prototype.getNext = function () {
//    this.currentAddress++;
    if(this.currentAddress > this.instructions.length) {
        this.currentAddress = 0;
      //  alert(this.currentAddress);
    }
    var result = this.instructions[this.currentAddress];
    return result;
}


//PC
function PC() {
    //start from 0?
    //0x00400000
    this.currentAddr = "00000000010000000000000000000000";
}

PC.prototype.setNextAddr = function(addr){
    this.currentAddr = addr;
};

//CONTROL
function Control() {
    this.opCode = "000000";
    this.RegDst = this.ALUSrc = this.MemtoReg = this.RegWrite = this.MemRead = this.MemWrite = this.Branch = this.ALUOp1 = this.ALUOp0 = "";
}
Control.prototype.setOpCode = function (opCode) {
    this.opCode = opCode;
    this.operation();
};
Control.prototype.operation = function () {
    var RFormat = AND(invert(this.opCode[0]), invert(this.opCode[1]), invert(this.opCode[2]), invert(this.opCode[3]), invert(this.opCode[4]), invert(this.opCode[5]));
    var lw = AND(this.opCode[0], invert(this.opCode[1]), invert(this.opCode[2]), invert(this.opCode[3]), this.opCode[4], this.opCode[5]);
    var sw = AND(this.opCode[0], invert(this.opCode[1]), this.opCode[2], invert(this.opCode[3]), this.opCode[4], this.opCode[5]);
    var beq = AND(invert(this.opCode[0]), invert(this.opCode[1]), invert(this.opCode[2]), this.opCode[3], invert(this.opCode[4]), invert(this.opCode[5]));
    this.RegDst = RFormat;
    this.ALUSrc = ORFAN2(lw,sw);
    this.MemtoReg = lw;
    this.RegWrite =ORFAN2(RFormat,lw);
    this.MemRead = lw;
    this.MemWrite = sw;
    this.Branch = beq;
    this.ALUOp1 = RFormat;
    this.ALUOp0 = beq;
};

//MEMORY
function MEMORY() {
    this.MemRead = "0";
    this.MemWrite = "0";
    this.writeData = "";
    this.address = ""; 
    this.ReadData = "";
    
    this.startingAddress = "268435456";//268435456-00010000000000000000000000000000
    this.maximumAddress  = "268697600";//268697600-00010000000001000000000000000000
    
    //data is in bytes every array is one byte, range from [10000000]..[10040000]
    this.data = new Array();
}
MEMORY.prototype.setReadOrWrite = function (write, read) {
    //will be provided by control module blocks
    this.MemRead = read;
    this.MemWrite = write;
};
MEMORY.prototype.setWriteData = function (data) {
    //run operation, either writeData is slower or address is slower
    this.writeData = data;
    this.operation();
};
MEMORY.prototype.setAddress = function (addr) {
    //run operation, either address is slower or writeData is slower
    //addr should be offset from starting address and smaller than maximum address
    var addr2 = new Binary()
    addr2.setValue(addr);
    if ( addr2.getInt() < this.startingAddress || addr2.getInt() > this.maximumAddress ) 
        return;
    addr2.setIntValue(addr2.getInt()-this.startingAddress);
    this.address = addr2.binary;
    this.operation();
}
MEMORY.prototype.operation = function () {
    //do something
    if (this.address === "" || this.writeData === ""){
        return;
    }
    if (this.MemRead === "1") {
        this.ReadData = this.data[this.address];  
        if (this.ReadData === undefined ) {
            this.ReadData = signExtendZero("0");
        }
    }
    if (this.MemWrite === "1") {
        this.data[this.address] = signExtendZero(this.writeData);
    }
};

//REGISTER
function Register() {
    //initialize registers
    this.r0=this.r1=this.r2=this.r3=this.r4=this.r5=this.r6=this.r7=this.r8=this.r9=this.r10=this.r11=this.r12=this.r13=this.r14=this.r15=this.r16=this.r17=this.r18=this.r19=this.r20=this.r21=this.r22=this.r23=this.r24=this.r25=this.r26=this.r27=this.r28=this.r29=this.r30=this.r31=signExtendZero("0");
    this.r3=this.r2="00000000000000000000000000000001";
    this.RegWrite = "0";
    this.writeRegi = "";
    this.readData1 = "";
    this.readData2 = "";
}
Register.prototype.regWrite = function (enable) {
    this.RegWrite = enable;
};
Register.prototype.writeReg = function (register) {
    this.writeRegi = register;
};
Register.prototype.writeData = function (data) {
    if (this.RegWrite==="1") {
        //write data into this.writeReg
        this['r'+binToInt(this.writeRegi)] = data;
    }
};
Register.prototype.readRegister1 = function (register) {
    this.readData1 = signExtendZero(this['r'+register]);
    return signExtendZero(this['r'+register]);
};
Register.prototype.readRegister2 = function (register) {
    this.readData2 = signExtendZero(this['r'+register]);
    return signExtendZero(this['r'+register]);
};


//HEXA
function Hexadecimal() {
    this.hexa = "";
    this.numOfBytes = 8;
}
Hexadecimal.prototype.setValue = function (hexa) {
    this.hexa = "00000000"+hexa;
    this.hexa = this.hexa.toString().slice(-8).toUpperCase();
};
Hexadecimal.prototype.setBinaryValue = function (binary) {
    var result = signExtendZero(binary);
    this.hexa = parseInt(result,2).toString(16);
    this.hexa = "00000000"+this.hexa;
    this.hexa = this.hexa.toString().slice(-8).toUpperCase();
};
Hexadecimal.prototype.getInt = function () {
    return parseInt(this.hexa,16);
};
Hexadecimal.prototype.getBinary = function () {
  return signExtendZero(parseInt(this.hexa,16).toString(2)); 
};
//BINARY
function Binary() {
    this.intValue= 0;
    this.bit = 32;
    this.binary = signExtendZero("0");
}
Binary.prototype.setValue = function(binary){
    this.binary = binary;
    this.intValue = this.getInt();
};
Binary.prototype.setIntValue = function (int) {
    if (int >= 0 ) {
    this.binary = signExtendZero(parseInt(int,10).toString(2));
    this.intValue = int;
    } else {
    this.binary = invert(signExtendZero(parseInt((int*-1)-1,10).toString(2)));
    this.intValue = int;    
    }
}
Binary.prototype.getInt = function(){
    //2's complement
    if(this.binary[0]=="1"){
        return (binToInt(invert(this.binary.substr(1)))+1)*(-1);
    } else {
        return binToInt(this.binary);
    }
};
