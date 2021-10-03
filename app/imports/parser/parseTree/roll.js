import resolve, { toString, traverse } from '../resolve.js';
import error from './error.js';
import rollArray from './rollArray.js';
import roll from '/imports/parser/roll.js';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS.js';

const rollNode = {
  create({left, right}) {
    return {
      parseType: 'roll',
      left,
      right,
    };
  },
  compile(node, scope, context){
    const {result: left} = resolve('compile', node.left, scope, context);
    const {result: right} = resolve('compile', node.right, scope, context);
    return {
      result: rollNode.create({left, right}),
      context,
    };
  },
  toString(node){
    if (
      node.left.parseType === 'number' && node.left.value === 1
    ){
      return `d${toString(node.right)}`;
    } else {
      return `${toString(node.left)}d${toString(node.right)}`;
    }
  },
  roll(node, scope, context){
    const {result: left} = resolve('reduce', node.left, scope, context);
    const {result: right} = resolve('reduce', node.right, scope, context);
    if (left.parseType !== 'number' && !Number.isInteger(left.value)){
      return errorResult('Number of dice is not an integer', node, context);
    }
    if (!right.isInteger){
      return errorResult('Dice size is not an integer', node, context);
    }
    let number = left.value;
    if (context.doubleRolls){
      number *= 2;
    }
    if (number > STORAGE_LIMITS.diceRollValuesCount){
      const message = `Can't roll more than ${STORAGE_LIMITS.diceRollValuesCount} dice at once`;
      return errorResult(message, node, context);
    }
    let diceSize = right.value;
    let values = roll(number, diceSize);
    if (context){
      context.storeRoll({number, diceSize, values});
    }
    return {
      result: rollArray.create({
        values,
        diceSize,
        diceNum: left.value,
      }),
      context
    };
  },
  reduce(node, scope, context){
    const {result} = rollNode.roll(node, scope, context);
    return resolve('reduce', result, scope, context);
  },
  traverse(node, fn){
    fn(node);
    traverse(node.left, fn);
    traverse(node.right, fn);
  },
}

function errorResult(message, node, context){
  context.error(message);
  return {
    result: error.create({ node, error: message }),
    context,
  };
}

export default rollNode;
