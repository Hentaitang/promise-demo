class NormalPromise {
  static catch(onRejected){
    // 相当于调用 then 方法, 但只传入 Rejected 状态的回调函数
    this.then(undefined, onRejected)
  }
  constructor(handle) {
    if (typeof handle !== 'function') {
      throw new Error('NormalPromise must accept a function as a parameter')
    }
    // 状态
    this._status = 'padding';
    // 成功参数
    this._value = undefined;
    // 失败原因
    this._reason = undefined;
    // 成功回调函数的数组
    this._successArray = [];
    // 失败回调函数的数组
    this._errorArray = [];
    // 执行 handle
    try {
      handle(this._resolve.bind(this), this._reject.bind(this))
    } catch (err) {
      this._reject(err)
    }
  }

  // 添加 resolve 时的执行函数
  _resolve(value) {
    setTimeout(()=>{
      if (this._status !== 'padding') return;
      const resolve = (val) => {
        this._status = 'fulfilled';
        this._value = val;
        this._successArray.forEach(suc => {
          suc(val)
        });
        this._successArray = []
      };
      const reject = (reason) => {
        this._status = 'rejected';
        this._reason = reason;
        this._errorArray.forEach(err => {
          err(reason)
        });
        this._errorArray = []
      };
      /* 如果resolve的参数为Promise对象，则必须等待该Promise对象状态改变后,
         当前Promise的状态才会改变，且状态取决于参数Promise对象的状态
     */
      if(value instanceof NormalPromise){
        value.then(resolve, reject)
      }else {
        resolve(value)
      }
    })
  }

  // 添加 reject 时的执行函数
  _reject(reason) {
    setTimeout(()=>{
      if (this._status !== 'padding') return;
      this._status = 'rejected';
      this._reason = reason;
      this._errorArray.forEach(err => {
        err(reason)
      });
      this._errorArray = []
    })
  }

  // 添加 then 方法
  then(onFulfilled, onRejected) {
    const {_value, _reason, _status} = this;
    // 返回一个新的 promise 对象
    return new NormalPromise((onFulfilledNext, onRejectedNext) => {
      // 封装一个成功时执行的函数
      const resolve = (value) => {
        try {
          if (typeof onFulfilled !== 'function') {
            // 判断 onFulfilled 是否为函数，不是则将参数传给下一个then的成功回调，并立即执行
            onFulfilledNext(value)
          } else {
            const res = onFulfilled(value);
            if (res instanceof NormalPromise) {
              // 如果当前回调函数返回 NormalPromise 对象，则必须等待其状态改变后再执行下一个回调
              res.then(onFulfilledNext, onRejectedNext)
            } else {
              // 否则将返回结果直接作为参数传给下一个then的成功回调，并立即执行
              onFulfilledNext(res)
            }
          }
        } catch (err) {
          // 如果函数执行出错，新的 Promise 对象的状态为失败
          onRejectedNext(err)
        }
      };
      // 封装一个失败时执行的函数
      const reject = (reason) => {
        try {
          if(typeof onRejected !== 'function'){
            onRejectedNext(reason)
          }else{
            const res = onRejected(reason);
            if(res instanceof NormalPromise){
              res.then(onFulfilledNext, onRejectedNext)
            }else{
              onRejectedNext(res)
            }
          }
        } catch (err) {
          onRejectedNext(err)
        }
      };
      switch (_status) {
        // 当状态为 padding 时，将then中的回调函数添加进执行数组中等待执行
        case 'padding':
          this._successArray.push(resolve);
          this._errorArray.push(reject);
          break;
        // 当状态发生改变后，直接调用对应的回调函数
        case 'fulfilled':
          resolve(_value);
          break;
        case 'rejected':
          reject(_reason);
          break
      }
    })
  }
}