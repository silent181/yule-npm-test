/**
 * 函数式编程集合
 */
import { get, isFunction, isArray, isObject } from 'lodash';

const hasOwnProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export { compose } from './compose';

/**
 * add or replace a "key" for every obj item in a list
 */
export const makeAddKeyForList = (key, val, overwritten = true) => (list = []) => list.map(
    (obj, index) => {
        return !overwritten && hasOwnProperty(obj, key) ? obj : {
            ...obj,
            [key]: isFunction(val) ? val(obj, index, list) : val
        }
    }
);

/**
 * add or replace a "key" for an obj
 */
export const makeAddKeyForObj = (key, val, overwritten = true) => obj => {
    return (!overwritten && hasOwnProperty(obj, key))
        || !isObject(obj) ? obj : {
            ...obj,
            [key]: isFunction(val) ? val(obj) : val
        }
}

/**
 * add "groupId" prop for every item in data.list
 * @param {Object} data 
 */
export const addGroupId = (data, field = 'list') => isArray(data[field]) ? makeAddKeyForObj(
    [field],
    makeAddKeyForList('_groupId', data.groupId)(data[field])
)(data) : data

/**
 * add "tabContent" prop for every item in tabs
 * @param {Array} tabs 
 * @param {Function} contentHandler 
 */
export const addContentForTabs = (tabs, contentHandler) => makeAddKeyForList(
    'tabContent',
    item => {
        const nextData = addGroupId(get(item, 'next.nextData', {}));
        const list = get(nextData, 'list', []);
        return isFunction(contentHandler) ? contentHandler(list) : list;
    }
)(tabs);

const defaultFormat = num => `${(num / 10000).toFixed(1)}万`;
export const addFollowers = (list, format = defaultFormat) => makeAddKeyForList(
    'followers',
    item => {
        const followCount = +get(item, 'next.followStatus.followCount', 0);
        return followCount < 1000 ? followCount : format(followCount);
    }
)(list);

export const getFirst = array => get(array, '[0]', {});

export const getFirstN = (array, n) => array ? array.slice(0, n) : [];

export const arrayUpdater = {
    replace: function (index, replacer) {
        return [
            ...this.slice(0, index),
            replacer,
            ...this.slice(index + 1)
        ]
    },

    add: function (index, ...adders) {
        return [
            ...this.slice(0, index),
            ...adders,
            ...this.slice(index)
        ]
    },

    delete: function (index = 0) {
        return [
            ...this.slice(0, index),
            ...this.slice(index + 1)
        ]
    }
}

export const makeTrunc = (trunc, max = 36) => (arr = []) => {
    if (max % trunc !== 0) {
        console.warn('不能整数截断');
    }
    const multiple = Math.floor(arr.length / trunc);
    return arr.slice(0, max).slice(0, multiple * trunc);
}

export const makePropertyFilter = (filterEvery, ...props) => item => {
    const filterFn = prop => item[prop];
    return filterEvery ? props.every(filterFn) : props.some(filterFn);
};

export const makeJoinStringReducer = (transformer, connectSign = ',') => (acc, cur, index, arr) => {
    if (!isFunction(transformer)) {
        throw new Error('makeJoinStringReducer第一个参数必须提供一个转换函数');
    }
    return `${acc}${transformer(cur)}${index === arr.length - 1 ? '' : connectSign}`;
}

/**
 * isPre: 当满足compareFn条件时元素是否前置，默认为false
 * 即满足条件的排在后面
 */
export const makeComparator = (compareFn, isPre = false) => (v1, v2) => {
    if (!isFunction(compareFn)) {
        throw new Error('makeComparator第一个参数必须为函数')
    }
    /**
     * 在isPre为false的情况下，若v1满足条件，而v2不满足条件，
     * 则v1应该排在后面，所以返回1，反之亦然
     */
    if (compareFn(v1) && !compareFn(v2)) {
        return isPre ? -1 : 1;
    } else if (!compareFn(v1) && compareFn(v2)) {
        return isPre ? 1 : -1;
    }
    return 0;
}

export const trunckStr = (str, max = 12) => str && str.length > max ?
    `${str.slice(0, max)}...` : str;

export const reverseArray = arr => arr.slice().reverse();

/**
 * 创建一个调用func的函数，thisArg绑定func函数中的 this (注：this的上下文为thisArg) ，并且func函数会接收partials附加参数。，调用的参数顺序从右到左
 * @param func
 * @param thisArg
 * @param partials
 * @returns {function(...[*]=): *}
 */
export const bindRight = (func, thisArg, ...partials) =>
    (...args) => func.apply(thisArg, reverseArray(partials.concat(args)));
