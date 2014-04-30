var ocargo = ocargo || {};

ocargo.Program = function(instructionHandler){
	this.instructionHandler = instructionHandler;
	this.stack = [];
	this.isTerminated = false;
};

ocargo.Program.prototype.step = function(level) {
	var stackLevel = this.stack[this.stack.length - 1];
	
	var commandToProcess = stackLevel.splice(0, 1)[0];
	if(stackLevel.length === 0){
		this.stack.pop();
	}
	
	commandToProcess.execute(this, level);
};

ocargo.Program.prototype.canStep = function() {
	return this.stack.length !== 0;
};

ocargo.Program.prototype.addNewStackLevel = function(commands) {
	this.stack.push(commands);
};

ocargo.Program.prototype.terminate = function() {
	this.stack = [];
	this.isTerminated = true;
};

function If(conditionalCommandSets, elseCommands, block){
	this.conditionalCommandSets = conditionalCommandSets;
	this.elseCommands = elseCommands;
	this.block = block;
}

If.prototype.execute = function(program, level) {
	this.block.select();
	
	var i = 0;
	while(i < this.conditionalCommandSets.length){
		if(this.conditionalCommandSets[i].condition(level)) {
			program.addNewStackLevel(this.conditionalCommandSets[i].commands.slice(0));
			program.stepCallback();
			return;
		}
		
		i++;
	}
	
	if(this.elseCommands){
		program.addNewStackLevel(this.elseCommands.slice(0));
	}
	
	program.stepCallback();
};

function While(condition, body, block){
	this.condition = condition;
	this.body = body;
	this.block = block;
}

While.prototype.execute = function(program){
	this.block.select();
	
	if(this.condition()){
		program.addNewStackLevel([this]);
		program.addNewStackLevel(this.body.slice(0));
	}
	
	program.stepCallback();
};

function counterCondition(count){
	var f = function(){
		if(count > 0){
			count--;
			return true;
		}
		
		return false;
	}
	
	return f;
}

function roadCondition(selection){
	var f = function(level){
		if(selection === 'FORWARD'){
			return FORWARD.getNextNode(level.van.previousNode, level.van.currentNode);
		}else if(selection === 'LEFT'){
			return TURN_LEFT.getNextNode(level.van.previousNode, level.van.currentNode);
		}else if(selection === 'RIGHT'){
			return TURN_RIGHT.getNextNode(level.van.previousNode, level.van.currentNode);
		}
	};
	
	return f;
}

function TurnLeftCommand(block){
	this.block = block;
}

TurnLeftCommand.prototype.execute = function(program){
	this.block.select();
	program.instructionHandler.handleInstruction(TURN_LEFT, program);
};

function TurnRightCommand(block){
	this.block = block;
}

TurnRightCommand.prototype.execute = function(program){
	this.block.select();
	program.instructionHandler.handleInstruction(TURN_RIGHT, program);
};

function ForwardCommand(block){
	this.block = block;
}

ForwardCommand.prototype.execute = function(program){
	this.block.select();
	program.instructionHandler.handleInstruction(FORWARD, program);
};

