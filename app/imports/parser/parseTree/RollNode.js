import ParseNode from '/imports/parser/parseTree/ParseNode.js';
import RollArrayNode from '/imports/parser/parseTree/RollArrayNode.js';
import ErrorNode from '/imports/parser/parseTree/ErrorNode.js';

export default class RollNode extends ParseNode {
  constructor({left, right}) {
		super(...arguments);
    this.left = left;
    this.right = right;
  }
  compile(scope, context){
    let left = this.left.compile(scope, context);
    let right = this.right.compile(scope, context);
    return new RollNode({left, right, previousNodes: [this]});
  }
  toString(){
    if (
      this.left.isNumberNode && this.left.value === 1
    ){
      return `d${this.right.toString()}`;
    } else {
      return `${this.left.toString()}d${this.right.toString()}`;
    }
  }
  roll(scope, context){
    let left = this.left.reduce(scope, context);
    let right = this.right.reduce(scope, context);
    if (!left.isInteger){
      return new ErrorNode({
        node: this,
        error: 'Number of dice is not an integer',
        previousNodes: [this, left, right],
      });
    }
    if (!right.isInteger){
      return new ErrorNode({
        node: this,
        error: 'Dice size is not an integer',
        previousNodes: [this, left, right],
      });
    }
    let number = left.value;
    if (context.doubleRolls){
      number *= 2;
    }
    if (number > 100) return new ErrorNode({
      node: this,
      error: 'Can\'t roll more than 100 dice at once',
      context,
    });
    let diceSize = right.value;
    let randomSrc = DDP.randomStream('diceRoller');
    let values = [];
    for (let i = 0; i < number; i++){
      let roll = ~~(randomSrc.fraction() * diceSize) + 1
      values.push(roll);
    }
    if (context){
      context.storeRoll({number, diceSize, values});
    }
    return new RollArrayNode({values});
  }
  reduce(scope, context){
    return this.roll(scope, context).reduce(scope, context);
  }
}
