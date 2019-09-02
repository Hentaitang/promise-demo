function EasyPromise(fn) {
  if(typeof fn !== 'function'){
    throw new Error('EasyPromise must accept function as a parameter')
  }
  let status = 'padding';
  const successArray = [];
  const errorArray = [];

  function resolve() {
    status = 'fulfilled';
    doneThen.apply(undefined, arguments)
  }

  function reject() {
    status = 'rejected';
    doneThen.apply(undefined, arguments)
  }

  function doneThen() {
    setTimeout(() => {
      if (status === 'fulfilled') {
        successArray.forEach(s => {
          s.apply(undefined, arguments)
        })
      } else {
        errorArray.forEach(e => {
          e.apply(undefined, arguments)
        })
      }
    })
  }

  fn.call(undefined, resolve, reject);

  return {
    then: function (successFn, errorFn) {
      successArray.push(successFn);
      errorArray.push(errorFn);
      return undefined
    }
  }
}