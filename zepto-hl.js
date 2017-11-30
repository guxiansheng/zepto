//     阅读Zepto.js最新版本 by HANLIN
//     像艾伦大神说的一样 学些框架看源码 除非你是牛人扫一眼 闭目YY一下就明白怎么搞了 ！
//     没有天赋的屌丝 还是自己实现一遍是最好的！
//     接下来就一行一行的敲一遍并协写上注释吧。方便一起学习！

var Zepto = (function () {
  // 首先 声明了一些变量 emptyArray = [] ,以后调用数组的方法就用 emptyArray 。
  // 还声明了一些正则表达式
  // 如果用 [] 来调用的话 每次都会创建一个空数组对象 影响性能。
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice
    document = window.document,
    // 缓存元素的默认 display 属性
    elementDisplay = {}, 
    // 缓存class的正则
    classCache = {},
    //设置CSS时，不用加px单位的属性
    cssNumber = {'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1, 'z-index': 1, 'zoom': 1 },
    // HTML代码片断的正则
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    // 单个标签正则
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    // 匹配非单独一个闭合标签的标签，类似将<div></div>写成了<div/>
    // 这里用到了正则表达式的 零宽断言中的负向前瞻 "?!" 也就是说 要匹配的字符串 在 < 后面 不能跟?!后面的内容
    // 这里的 第一个分组是 (([\w:]+)[^>]*) => 匹配到的内容可以用 $1 表示
    // 第二个分组是 ([\w:]+) => 匹配到的内容可以用 $2 表示 
    // $2 匹配到的是 标签名 不包括标签名后面的 属性=属性值
    // $1 匹配到的是 < 这中间的所有内容 />
    tagExpanderRE = /<(?!area|br|col|embed|hr?img?input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    // 匹配根节点
    rootNodeRE = /^(?:body|html)&/i,
    capitalRE = /([A-Z])/g,

    // 元素属性操作
    // 需要提供get和set的方法名
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset']
    // 元素位置操作
    // 相邻节点的一些操作
    adjacencyOperators = ['after', 'prepend', 'before', 'append'],

    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    // 容器
    // 这里的用途是当需要给tr,tbody,thead,tfoot,td,th设置innerHTMl的时候，需要用其父元素作为容器来装载HTML字符串
    containers = {
      'tr': document.createElement('table'),
      'tbody': table,
      'thead': table,
      'tfoot': table,
      'td': tableRow,
      'th': tableRow,
      '*' document.createElement('div')
    },

    simpleSelectorRE = /^[\w-]*$/,
    // 类型判定的对象
    class2type = {},

    toString = class2type.toString,
    zepto = {},
    camelize,
    uniq,
    tempParent = document.createElement('div'),
    // 属性对象映射
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    // isArray方法
    isArray = Array.isArray || function (object) {
      return object instanceof Array
    }
    
  zepto.matches = function (element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector || 
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector; 
    if (matchesSelector) return matchesSelector.call(element, selector);
    var match, parent = element.parentNode, temp = !parent
    if (temp) {
      (parent = tempParent).appendChild(element);
    }
    // 将parent作为上下文，来查找selector的匹配结果，并获取element在结果集的索引，不存在时为－1,再通过~-1转成0，存在时返回一个非零的值
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    // 这里返回的是一个布尔值
    return match
  }

  // 下面是一些私有的方法供内部调用
  // 首先是类型的判定函数
  // 获取对象类型 
  // 这里的类型判断用的是 这个方法
  /*
    var _toS = {}.toString, 
        class2type = { 
        'undefined' : 'undefined', 
        'number' : 'number', 
        'boolean' : 'boolean', 
        'string' : 'string', 
        '[object Function]' : 'function', 
        '[object RegExp]' : 'regexp', 
        '[object Array]' : 'array', 
        '[object Date]' : 'date', 
        '[object Error]' : 'error'
    }; 
    function type(o) { 
        return class2type[typeof o] || class2type[_toS.call(o)] || (o ? 'object' : 'null'); 
    }  
  */
  function type(obj) {
     return obj == null ? String(obj) :
     class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) {
    return type(value) == "function"
  }

  // 这个方法虽然简单 但是粗糙 对有的情况是不能正确判断的 所以有漏洞！
  function isWindow(obj) {
    return obj != null && obj == obj.window
  }

  function isDocument(obj) {
    return obj != null && obj.nodeType == obj.DOCUMENT_NODE
  }

  function isObject(obj) {
    return type(obj) == "object"
  }
  // 是否是干净的对象，最开始是用来合并对象的
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  // '跟jq3.0一模一样 内部使用 不暴露出去'
  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
      type = $.type(obj)
  
      return 'function' != type && !isWindow(obj) && (
        'array' == type || length === 0 || 
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
      )
  };

  // 去除数组里的null , undefined
  function compact(array) {
    return filter.call(array, function(item) {
      return item != null
    })
  }

  // 这里的 concat也是数组原生的 concat方法
  // concat() 方法用于连接两个或多个数组。
  // 该方法不会改变现有的数组，而仅仅会返回被连接数组的一个副本。
  function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array
  }

  // 把中横线转成驼峰字符串
  // 这里的match代表整个匹配的字符串  
  // chr代表第一个分组匹配的字符 也就是()内的一个字符 因为这里没有范围限制 所以只匹配 - 后面的一个字符
  camelize = function (str) {
    return str.replace(/-+(.)?/g, function (match, chr) {
      return chr ? chr.toUpperCase() : ''
    })
  }

  // 把驼峰转成中横线全小写
  // 将字符串格式化成-拼接的形式,一般用在样式属性上，比如border-width
  function dasherize(str) {
    return str.replace(/::/g, '/')
              .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')// 在大小写字符之间插入_,大写在前，比如AAAbb,得到AA_Abb
              .replace(/([a-z\d])([A-Z])/g, '$1_$2')// 在大小写字符之间插入_,小写或数字在前，比如bbbAaa,得到bbb_Aaa
              .replace(/_/g, '-')// 将_替换成-
              .toLowerCase()
  }

  // 数组去重 也可以用es6的 [...new set()]会自动过滤掉相同的对象
  // 数组去重，如果该条数据在数组中的位置与循环的索引值不相同，则说明数组中有与其相同的值
  uniq = function (array) {
    return filter.call(array, function (item, index) {
      return array.indexOf(item) == index
    })
  }

  // 获取class正则
  function classRE(name) {
    // classCache,缓存正则 如果有就直接返回 如果没有就生成新的正则再返回。
    // 用new RegExp()动态生成的正则表达式 参数如果有斜杠 一定要双重转义 如果字面量正则里斜杠有1根 那么这里就有两根。以此类推
    return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' +name+ '(\\s|$)'))
  }

  // 给该加px的css属性加上px单位
  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + 'px' : value
  }

  // 获取元素默认的display属性
  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      // 通过 getComputedStyle获取到的是一个对象 通过对象的getPropertyValue方法 传入属性名 可以获取元素的某个属性的值 这都是原生JS的方法 
      display = getComputedStyle(element, '').getPropertyValue('display')
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  // 获取子元素集合
  // 如果支持children  就用children 因为children只包含元素节点。否则就通过遍历判断节点类型 来筛选
  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function (node) {
        if (node.nodeType == 1) {
          return node
        }
      })
  }

  // 整个zepto的构造函数 把dom集合一个类数组对象里面 方便批量操作
  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < length; i++) {
      this[i] = dom[i]
    }
    this.length = len
    this.selector = selector || ''
  }

  // Zepto。片段`以HTML字符串和一个可选的标签名称
  // 从给定的HTML字符串生成DOM节点。
  // 生成的DOM节点作为数组返回。
  // 可以在插件中重写这个函数，例如
  // 它与不完全支持DOM的浏览器兼容。

  zepto.fragment = function (html, name, properties) {
    var dom, nodes, container
    // 单个标签的特殊情况优化
    if (singleTagRE.test(html)) {
      dom = $(document.createElement(RegExp.$1))
    }
    // 非单个标签的特殊情况
    if (!dom) {
      // 将类似<div class="test"/>替换成<div class="test"></div>,算是一种修复吧
      // 如果replace方法存在说明 html是字符串 就用replace 把写错的单标签 替换成完整的 html标签
      if (html.replace) {
        html = html.replace(tagExpanderRE, "<$1></$2>")
      }
      // 给name取标签名
      // RegExp.$1匹配到的第一个分组 就是html元素的 标签名
      if (name === undefined) {
        name = fragmentRE.test(html) && RegExp.$1
      }
      if (!(name in containers)) {
        // 设置容器标签名，如果不是tr,tbody,thead,tfoot,td,th，则容器标签名为div
        name = "*"
      }

      container = containers[name]
      container.innerHTML = '' + html
      // 取容器的子节点，这样就直接把字符串转成DOM节点了
      // childNodes 是一个 nodeList动态集合 包括所有节点类型的节点
      // 这里slice方法 返回的是一个新的数组，与原来的container.childNodes 已经是两个不同的对象了，虽然值一样 但是引用不一样！
      dom = $.each(slice.call(container.childNodes), function () {
        container.removeChild(this)
      })
    }

    // 如果properties是对象, 则将其当作属性来给添加进来的节点进行设置
    if (isPlainObject(properties)) {
      nodes = $(dom)// 将dom转成zepto对象，为了方便下面调用zepto上的方法
      // 遍历对象，设置属性
      $.each(properties, function (key, value) {
        // 如果设置的是'val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'，则调用zepto上相对应的方法
        if (methodAttributes.indexOf(key) > -1) {
          nodes[key](value)
        } else {
          nodes.attr(key, value)
        }
      })
    }
    // 返回将字符串转成的DOM节点后的数组，比如'<li></li><li></li><li></li>'转成[li,li,li]
    return dom
  };

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function (dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function (object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.  
  zepto.init = function (selector, context) {
    var dom
    // 如果没有了选择器，返回一个空集合
    if (!selector) return zepto.Z()
    // 字符串选择器
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // 如果它是一个HTML片段，从它创建节点
      // 注意：在Chrome 21和Firefox 15中，DOM错误12
      // 如果片段不以<开头>抛出。
      if (selector[0] == '<' && fragmentRE.test(selector)) {
        dom = zepto.fragment(selector, RegExp.$1, context),
        selector = null;
      }
      // 如果存在上下文context，则在上下文中查找selector，此时的selector为普通的CSS选择器
      else if (context !== undefined) {
        return $(context).find(selector)
      }
      // 如果不存在上下文的情况下直接使用querySelectorAll()这个api
      else {
        dom = zepto.qsa(document, selector)
      }
    }
    // 如果参数是函数
    else if (isFunction(selector)) {
      // 如果selector是个函数，则在DOM ready的时候执行它
      return $(document).ready(selector)
    }
    // 如果参数是zepto类的实例 就直接返回
    else if (zepto.isZ(selector)) {
      return selector
    }
    else {
      // 如果参数是一个节点集合（类数组） 就把它变成真正的数组,将其里面的null,undefined去掉
      if (isArray(selector)) {
        dom = compact(selector)
      }
      // 如果selector是个对象，注意DOM节点的typeof值也是object，所以在里面还要再进行一次判断
      else if(isObject(selector)) {
        dom = [selector],
        selector = null
      }
      // 这里又重复判断了字符串类的参数，不是很明白为什么这样重复判断，不过据我猜测无非就是为了更加的严谨吧
      else if (fragmentRE.test(selector)) {
        dom = zepto.fragment(selector.trim(), RegExp.$1, context),
        selector = null
      }
      else if (context != undefined) {
        return $(context).find(selector)
      }
      else {
        dom = zepto.qsa(document, selector)
      }
    }
    return zepto.Z(dom, selector)
  }

  //````将成为基本的`Zepto`对象。 当调用这个
  //函数只是调用`$ .zepto.init，这使得实现
  //选择节点和创建Zepto集合的细节
  //可以在插件中打补丁
  $ = function(selector, context) {
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source) {
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
          target[key] = {}
        }
        if (isArray(source[key]) && !isArray(target[key])) {
          target[key] = []
        }
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) {
        target[key] = source[key]
      }
    }
  }

  //复制一个或多个未定义的属性
  //对象到`target`对象。
  $.extend = function (target) {
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function (arg) {
      extend(target, arg, deep)
    })
    return target
  }
  
  //`zepto.qsa`是Zepto的CSS选择器实现
  //使用`document.querySelectorAll`并优化一些特殊情况，比如`＃id`。
  //这个方法可以在插件中被覆盖。
  zepto.qsa = function (element, selector) {
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        // 确保1个字符标签的名称仍然被检查
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
        // 简单的匹配字符串 不包括混合选择器哦
        isSimple = simpleSelectorRE.test(nameOnly)
    return (element.getElementById && isSimple && maybeID ) ?
      // ID选择器 
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ?
        // 如果是类名
        maybeClass ? element.getElementsByClassName(nameOnly) :
        // 如果是标签名
        element.getElementsByTagName(selector) :
        // 否则就用这个api去搜索包括混合选择器
        element.querySelectorAll(selector)
      )
  }

  // 过滤元素
  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  // 判断一个元素是否是另一个元素的子元素
  $.contains = document.documentElement.contains ? 
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function (parent, node) {
      while (node && (node = node.parentNode)) {
        if (node === parent) {
          return true
        }
      }
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // 在尊重SVGAnimatedString的同时访问className属性
  function className(node, value) {
    var klass = node.className || '',
        svg = klass && klass.baseVal !== undefined
    // 如果value等于undefined说明是获取className
    if (value === undefined) {
      return svg ? klass.baseVal : klass
    }
    // 如果value不等于undefined 就设置className属性或者svg的klass.baseVal属性
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          + value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) : 
            value ) 
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  // 是否是空元素
  $.isEmptyObject = function (obj) {
    var name
    for (name in obj) return false
    return true
  }

  // 是否是有效数字
  $.isNumeric = function(val) {
    var num = Number(val),
        type = typeof val
    return val != null && type != 'boolean' &&
      // 判断不是空字符串
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  }

  // 判断元素是不是在数组的指定索引以后
  $.inArray = function (elem, array, i) {
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function (str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // 插件兼容性
  $.uuid = 0
  $.support = {}
  $.expr = {}
  $.noop = function () {}

  $.map = function (elements, callback) {
    var value, values = [], i, key
    // 如果是类数组
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++) {
        // 挨个调用回调函数
        value = callback(elements[i], i)
        // 如果回调函数的返回值不等于null 就添加到新的数组里面
        if (value != null) {
          values.push(value)
        } 
      }
    }
    else {
      // 如果是对象
      for (key in elements) {
        value = callback(elements[key], key)
        // 如果回调函数的返回值不等于null 就添加到新的数组里面
        if (value != null) {
          values.push(value)
        }
      }
    }
    // 最后把回调函数的结果装在数组里返回
    return flatten(values)
  }

  $.each = function(elements, callback) {
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++) {
        if (callback.call(elements[i], i, elements[i]) === false) {
          // 退出遍历
          return elements
        }
      }
    }
    else {
      for (key in elements) {
        if (callback.call(elements[key], key, elements[key]) === false) {
          // 退出遍历
          return elements
        }
      }
    }
    // 返回传进来的数组
    return elements
  }

  $.grep = function (elements, callback) {
    // 返回过滤后的元素集合
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse
  
  // 填充class2type对象
  $.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function (i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  //定义所有可用的方法
  // Zepto集合
  // zepto和$共享的原型对象
  $.fn = {
    constructor: zepto.Z,
    length: 0,
    //因为集合就像一个数组
    //借用原生数组的方法。
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function() {
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray : this, args)
    },
    map: function(fn) {
      // 使用$包裹 方便链式调用
      return $($.map(this, function(el, i) {
        return fn.call(el, i, el) 
      }))
    },
    slice: function () {
      // 使用$包裹 方便链式调用
      // apply接受的参数必须是数组或者类数组arguments就是类数组
      return $(slice.apply(this, arguments))
    },
    ready: function(callback) {
      // 不要在IE <= 10上使用“interactive”（可能会触发过早）
      if (document.readyState === "complete" || 
        (document.readySatet !== "loading" && !document.documentElement.doScroll)) {
          setTimeout(function() {
            callback($)
          }, 0)
      }
      else {
        var handler = function () {
          document.removeEventListener('DOMContentLoaded', handler, false)
          window.removeEventListener('load', handler, false)
          callback($)
        }
        document.addEventListener("DOMContentLoaded", handler, false)
        window.addEventListener("load", handler, false)
      }
      return this
    },
    get: function(idx) {
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function() {
      return this.get()
    },
    size: function() {
      return this.length
    },
    remove: function() {
      return this.each(function () {
        if (this.parentNode != null) {
          this.parentNode.removeChild(this)
        }
      })
    },
    each: function(callback) {
      emptyArray.every.call(this, function(el, idx) {
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    // 这个方法的主要目的就是 filter方法的取反，
    // 也就是说把被filter函数过滤掉的元素装在数组里返回，还可以链式调用
    not: function(selector) {
      var nodes = []
      if (isFunction(selector) && selector.call !== undefined) {
        this.each(function(idx) {
          // 如果过滤参数是一个函数，就遍历元素挨个执行过滤的函数
          // 把满足过滤条件的结果去掉，不满足条件的就不用过滤，装在数组里
          if (!selector.call(this, idx)) {
            nodes.push(this)
          }
        })
      }
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el) {
          if (excludes.indexOf(el) < 0) {
            // 在这里把被过滤掉的元素装在数组里
            nodes.push(el)
          }
        })
      }
      // $包裹，方便链式调用
      return $(nodes)
    },
    filter: function(selector) {
      if (isFunction(selector)) {
        return this.not(this.not(selecotr))
      }
      return $(filter.call(this, function(element) {
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector, context) {
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector) {
      return typeof selector == 'string' ? this.length > 0 && zepto.matches(this[0], selector) :
        selector && this.selector == selector.selector
    },
    has: function(selector) {
      return this.filter(function() {
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx) {
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function() {
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function() {
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector) {
      var result, $this = this
      if (!selector) {
        result = $()
      }
      else if (typeof selector == 'Object') {
        result = $(selector).filter(function() {
          var node = this
          return emptyArray.some.call($this, function(parent) {
            return $.contains(parent, node)
          })
        })
      }
      else if (this.length == 1) {
        result = $(zepto.qsa(this[0], selector))
      }
      else {
        result = this.map(function() {
          return zepto.qsa(this, selector)
        })
      }
      return result
    },
    // 从元素本身开始，逐级向上级元素匹配，并返回最先匹配selector的元素。
    // 如果给定context节点参数，那么只匹配该节点的后代元素。这个方法与 parents(selector)有点相像，
    // 但它只返回最先匹配的祖先元素。
    // 如果参数是一个Zepto对象集合或者一个元素，结果必须匹配给定的元素而不是选择器。
    closest: function(selector, context) {
      var nodes = [], collection = typeof selector == 'object' && $(selector)
      this.each(function(_, node) {
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector) )) {
          node = node !== context && !isDocument(node) && node.parentNode
        }
        if (node && nodes.indexOf(node) < 0) {
          nodes.push(node)
        }
      })
      return $(nodes)
    },
    // 与closest有点相像
    // 如果只想获取到第一个符合css选择器的元素，使用closest。
    parents: function(selector) {
      var ancestors = [], nodes = this
      while (nodes.length > 0) {
        nodes = $.map(nodes, function(node) {
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      }
      // 首先通过循环遍历获取全部祖先元素 然后返回过滤掉的数组集合
      return filtered(ancestors, selector)
    },
    // 获取对象集合中每个元素的直接父元素。
    // 如果css选择器参数给出。过滤出符合条件的元素。
    parent: function(selector) {
      return filtered(uniq(this.pluck('parentNode'), selector))
    },
    children: function(selector) {
      return filtered(this.map(function() {
        return children(this)
      }),selector)
    },
    // 获得每个匹配元素集合元素的子元素，包括文字和注释节点。
    // （愚人码头注：.contents()和.children()方法类似，只不过前者包括文本节点以及jQuery对象中产生的HTML元素。）
    contents: function() {
      return this.map(function() {
        // contentDocument 属性以 HTML 对象返回框架容纳的文档。
        // 可以通过所有标准的 DOM 方法来处理被返回的对象。
        return this.contentDocument || slice.call(this.childNodes)
      })
    },
    siblings: function(selector) {
      return filtered(this.map(function(i, el) {
        return filter.call(children(el.parentNode), function(child) {
          // 排除自己
          return child !== el
        })
      }), selector)
    },
    empty: function() {
      return this.each(function() {
        this.innerHTML = ''
      })
    },
    //`pluck`是从Prototype.js中借用的
    pluck: function() {
      return this.map(this, function(el) {
        return el[property]
      })
    },
    show: function() {
      return this.each(function() {
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none") {
          // 恢复元素默认的display属性或者block
          this.style.display = defaultDisplay(this.nodeName)
        }
      })
    },
    //用给定的内容替换所有匹配的元素。(包含元素本身)。content参数可以为 before中描述的类型。
    replaceWith: function(newContent) {
      return this.before(newContent).remove()
    },
    wrap: function(structure) {
      var func = isFunction(structure)
      if (this[0] && !func) {
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1
      }
      return this.each(function(index) {
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure) {
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // 深入到最内层的元素
        while ((children = structure.children()).length) {
          structure = children.first()
        }
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure) {
      var func = isFunction(structure)
      return this.each(function(index) {
        var self = $(this), contents = self.contents(),
            dom = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function() {
      this.parent().each(function() {
        // 子节点会替换所有的父节点
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function() {
      return this.map(function() {
        return this.cloneNode(true)
      })
    },
    hide: function() {
      return this.css("display", "none")
    },
    toggle: function(setting) {
      return this.each(function() {
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector) {
      return $(this.pluck("previousElementSibling")).filter(selector || "*")
    },
    next: function(selector) {
      return $(this.pluck("nextElementSibling")).filter(selector || "*")
    },
    html: function(html) {
      return 0 in arguments ? // 如果有参数 就是设置
        this.each(function(idx) {
          var originHtml = this.innerHTML
          $(this).empty().append(funcArg(this, html, idx, originHtml))
        }) : 
        (0 in this ? this[0].innerHTML : null) // 如果没有参数，就是获取html片段
    },
    text: function(text) {
      return 0 in arguments ?
        this.each(function(idx) {
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value) {
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
      (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
      this.each(function(idx) {
        if (this.nodeType !== 1) {
          return
        }
        if (isObject(name)) {
          for (key in name) {
            setAttribute(this, key, name[key])
          }
        }
        else {
          setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        }
      })
    },
    removeAttr: function(name) {
      return this.each(function() {
        this.nodeType === 1 && name.split(' ').forEach(function(attribute) {
          // 由于没有value 所以这里的setAttribute是移除属性的意思
          setAttribute(this, attribute)
        }, this)
      })
    },
    prop: function(name, value) {
      name = propMap[name] || name
      return (typeof name == 'string' && !(1 in arguments)) ?
        (this[0] && this[0][name]) :
        this.each(function(idx) {
          if (isObject(name)) {
            for (key in name) {
              this[propMap[key] || key] = name[key]
            }
          }
          else {
            this[name] = funcArg(this, value, idx, this[name])
          }
        })
    },
    removeProp: function(name) {
      name = propMap[name] || name
      return this.each(function() {
        delete this[name]
      })
    },
    data: function(name, value) {
      // 驼峰转中横线
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()
      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)
        // 返回序列化的对象或者undefined
      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value) {
      if (0 in arguments) {
        if (value == null) {
          value = ""
        }
        return this.each(function(idx) {
          this.value = funcArg(this, value, idx, this.value)
        })
      }
      else {
        return this[0] && (this[0].multiple ? 
          $(this[0]).find('option').filter(function() {
            return this.selected
          }).pluck('value') : this[0].value )
      }
    },
    offset: function(coordinates) {
      if (coordinates) {
        // 有参数的情况下就设置偏移
        return this.each(function(index) {
          var $this = $(this),
              coords = funcArg(this, coordinates, index, $this.offset()),
              parentOffset = $this.offsetParent().offset,
              props = {
                top : coords.top  - parentOffset.top,
                left: coords.left - parentOffset.left
              }
          if ($this.css('position') == 'static') {
            props['position'] = 'relative'
          }
          // 设置偏移
          $this.css(props)
        })
      }
      // 如果元素集合是空的 就直接返回null
      if (!this.length) {
        return null
      }
      // html元素
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0])) {
        return {
          top : 0,
          left: 0
        }
      }
      var obj = this[0].getBoundingclientRect()
      return {
        left : obj.left + window.pageXOffset, // 视窗+滚动
        top  : obj.top + window.pageYOffset,  // 视窗+滚动
        width: Math.round(obj.width),
        height:Math.round(obj.height)
      }
    },
    css: function(property, value) {
      // 获取属性值
      if (arguments.length < 2) {
        var element = this[0]
        if (typeof property == 'string') {
          if (!element) {
            return
          }
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        }
        else if (isArray(property)) {
          if (!element) {
            return
          }
          var props = {}
          var computedStyle = getComputedStyle(element, '')
          $.each(property, function(_, prop) {
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }
      // 设置属性值
      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0) {
          this.each(function() {
            this.style.removeProperty(dasherize(property))
          })
        }
        else {
          css = dasherize(property) + ':' + maybeAddPx(property, value)
        }
      }
      else {
        for (key in property) {
          if (!property[key] && property[key] !== 0) {
            this.each(function() {
              this.style.removeProperty(dasherize(key))
            })
          }
          else {
            css += dasherize(key) +':'+ maybeAddPx(key, property[key]) + ';'
          }
        }
      }
      // 为每一个元素加上这段css
      return this.each(function() {
        this.style.cssText += ';' + css
      })
    },
    index: function(element) {
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name) {
      if (!name) {
        return false
      }
      return emptyArray.some.call(this, function(el) {
        // 这里的 this 指的就是 classRE(name) 这个正则表达式
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name) {
      if (!name) {
        return this
      }
      return this.each(function(idx) {
        if (!('className' in this)) {
          return
        }
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass) {
          if (!$(this).hasClass(klass)) {
            classList.push(klass)
          }
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name) {
     return this.each(function(idx) {
      if (!('className' in this)) {
        return
      }
      if (name === undefined) {
        // 移除所有的className
        return className(this, '')
      }
      // 获取当前每个dom对象的字符串
      classList = className(this)
      funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
        classList = classList.replace(classRE(klass), " ")
      })
      // 重新设置每个dom对象的className属性
      className(this, classList.trim())
     })
    },
    toggleClass: function(name, when) {
      if (!name) {
        return this
      }
      return this.each(function(idx) {
        var $this = this,
            // 需要添加或删除的className
            names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass) {
          (when === undefined ? !hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })    
      })
    },
    scrollTop: function(value) {
      if (!this.length) {
        return
      }
      var hasScrollTop = 'scrollTop' in this[0]
      // 获取纵向滚动距离
      if (value === undefined) {
        return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      }
      // 设置纵向滚动距离
      return this.each(hasScrollTop ?
        function() {this.scrollTop = value } :
        // scrollTo方法接受两个参数 X，Y的滚动距离
        function() {this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value) {
      if (!this.length) {
        return
      }
      var hasScrollLeft = 'scrollLeft' in this[0]
      // 获取横向滚动距离
      if (value === undefined) {
        return hasClassLeft ? this[0].scrollLeft : this[0].pageXOffset
      }
      // 设置横向滚动距离
      return this.each(hasClassLeft ?
        function() {this.scrollLeft = value } :
        // scrollTo方法接受两个参数 X，Y的滚动距离
        function() {this.scrollTo(value, this.scrollY)})
    },
    position: function() {
      if (!this.length) {
        return
      }
      var elem = this[0],
          offsetParent = this.offsetParent(),
          offset       = this.offset(),
          parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {top: 0, left: 0} : offsetParent.offset()
      
      offset.top -= parseFloat( $elem.css('margin-top') ) || 0
      offset.left-= parseFloat( $elem.css('margin-left') ) || 0

      parentOffset.top += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left+= parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      return {
        top : offset.top - parentOffset.top,
        left: offset.left- parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function() {
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static") {
          parent = parent.offsetParent
        }
        return parent
      })
    },
  }

  $,fn.detach = $.fn.remove

  zepto.Z.prototype = Z.prototype = $.fn

  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)

// 未完成，还差两个方法没写！！！！
// 2017-11-30 22：41：58 by hanlin
