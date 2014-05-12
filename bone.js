function AND() {
    //input is in string of '1's and '0's
    "use strict";
    var result = arguments[0];
    for (var i=1; i < arguments.length; i++) {
        result = ANDFAN2(result,arguments[i]);
    }
    return result;
}
function ANDFAN2(input1,input2){
    if(input1.length == input2.length){
        if(input1.length == 1){
            return (input1 == 1 && input2 == 1)?"1":"0";
        } 
        var output ="";
        while(input1.length>0){
            output+=ANDFAN2(input1.substr(0,1),input2.substr(0,1));
            input1 = input1.substr(1);
            input2 = input2.substr(1);
        }
        return output;
    } 
    return ;
}
function XORFAN2(input1,input2){
    if(input1.length == input2.length){
        if(input1.length == 1){
            return (input1 == input2)?"0":"1";
        } 
        var output ="";
        while(input1.length>0){
            output+=XORFAN2(input1.substr(0,1),input2.substr(0,1));
            input1 = input1.substr(1);
            input2 = input2.substr(1);
        }
        return output;
    } 
    return ;
}
function ORFAN2(input1,input2){
    if(input1.length == input2.length){
        if(input1.length == 1){
            return (input1 == 1 || input2 == 1)?"1":"0";
        } 
        var output ="";
        while(input1.length>0){
            output+=ORFAN2(input1.substr(0,1),input2.substr(0,1));
            input1 = input1.substr(1);
            input2 = input2.substr(1);
        }
        return output;
    } 
    return ;
}
function MUX(){
    //argument 0 is always the selector bits, argument 1.... is the input
    //not legit way of a multiplexer
    if (arguments[Math.pow(2,arguments[0].length)] == undefined){
        return "fail";
    }
    var selector = binToInt(arguments[0]);
    return arguments[selector+1];
}


function FULLADDER(cIN, A, B) {
    A = signExtendZero(A);
    B = signExtendZero(B);
    cIN = signExtendZero(cIN);
    var SUM = XORFAN2(cIN,XORFAN2(A,B));
    var CARRY = ORFAN2(ANDFAN2(A,B),ANDFAN2(cIN,XORFAN2(A,B)));
    return [CARRY,SUM];
}
function PARALLELADDER(cIN, A, B){
    var rippleIN = cIN;
    var output= "";
    var length = A.length;
    for(var i=1;i<=length; i++){
        var addResult = FULLADDER(rippleIN,A.substr(A.length-i,1),B.substr(B.length-i,1));
        output = addResult[1][31]+output;
        rippleIN = addResult[0][31];
    }
    return [rippleIN,output];
}


function SLL(SHAMT,A){
    //too cumbersome to do the legit way
    var output = signExtendZero(A);
    for(var i=0;i<SHAMT;i++){
        output = output+ "0";   
    }
    return output.substr(SHAMT);
}
function SRL(SHAMT,A){
    var output = signExtendZero(A);
    for(var i=0;i<SHAMT;i++){
        output = "0"+output;   
    }
    return output.substr(0,32);   
}


//Below contains 1 input functions
function invert(binary){
    var output = "";
    for(var i = 0;i<binary.length;i++){
        if(binary[i]=="1"){
            output += "0";
        } else {
            output += "1";
        }
    }
    return output;
}
function binToInt(binary){
    var value = 0;
    var count = 0;
    while(binary.length>0){
        value += parseInt(binary.substr(binary.length-1))*Math.pow(2,count++);
        binary = binary.substr(0,binary.length-1);
    }
    return value;
}
function signExtendZero(binary) {
    //output will be 32 bit irregardless of input
    var output = "";
    for(var i=binary.length;i<32;i++){
        output += 0;   
    }
    output += binary;
    return output;
}

function signExtend(binary) {
    //output will be 32 bit irregardless of input
    var output = "";
    var leadingbit = binary.substr(0,1);
    for(var i=binary.length;i<32;i++){
        output += leadingbit;   
    }
    output += binary;
    return output;
}
