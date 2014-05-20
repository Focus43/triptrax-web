/*! My Website - Build v0.1.0 (2014-05-19)
Author: Stine Richvoldsen  */
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
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
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (isDocument(element) && isSimple && maybeID) ?
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        isSimple && !maybeID ?
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = function(parent, node) {
    return parent !== node && parent.contains(node)
  }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className,
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
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
    var num
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          !/^0/.test(value) && !isNaN(num = Number(value)) ? num :
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

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return arguments.length === 0 ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return arguments.length === 0 ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = (text === undefined) ? '' : ''+text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (value === undefined) ?
        (this[0] && this[0][name]) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + name.replace(capitalRE, '-$1').toLowerCase(), value)
      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return arguments.length === 0 ?
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        ) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },

    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0], computedStyle = getComputedStyle(element, '')
        if(!element) return
        if (typeof property == 'string')
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        else if (isArray(property)) {
          var props = {}
          $.each(isArray(property) ? property: [property], function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          traverseNode(parent.insertBefore(node, target), function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
;
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  // __proto__ doesn't exist on IE<11, so redefine
  // the Z function to use object extension instead
  if (!('__proto__' in {})) {
    $.extend($.zepto, {
      Z: function(dom, selector){
        dom = dom || []
        $.extend(dom, $.fn)
        dom.selector = selector || ''
        dom.__Z = true
        return dom
      },
      // this is a kludge but works
      isZ: function(object){
        return $.type(object) === 'array' && '__Z' in object
      }
    })
  }

  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle;
    window.getComputedStyle = function(element){
      try {
        return nativeGetComputedStyle(element)
      } catch(e) {
        return null
      }
    }
  }
})(Zepto)
;
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // items in the collection might not be DOM elements
      if('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)
;
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.serializeArray = function() {
    var result = [], el
    $([].slice.call(this.get(0).elements)).each(function(){
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function(){
    var result = []
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)
;
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred()
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)
    if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)
;
//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// The following code is heavily inspired by jQuery's $.fn.data()

;(function($){
  var data = {}, dataAttr = $.fn.data, camelize = $.camelCase,
    exp = $.expando = 'Zepto' + (+new Date()), emptyArray = []

  // Get value from node:
  // 1. first try key as given,
  // 2. then try camelized key,
  // 3. fall back to reading "data-*" attribute.
  function getData(node, name) {
    var id = node[exp], store = id && data[id]
    if (name === undefined) return store || setData(node)
    else {
      if (store) {
        if (name in store) return store[name]
        var camelName = camelize(name)
        if (camelName in store) return store[camelName]
      }
      return dataAttr.call($(node), name)
    }
  }

  // Store value under camelized key on node
  function setData(node, name, value) {
    var id = node[exp] || (node[exp] = ++$.uuid),
      store = data[id] || (data[id] = attributeData(node))
    if (name !== undefined) store[camelize(name)] = value
    return store
  }

  // Read all "data-*" attributes from a node
  function attributeData(node) {
    var store = {}
    $.each(node.attributes || emptyArray, function(i, attr){
      if (attr.name.indexOf('data-') == 0)
        store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
    })
    return store
  }

  $.fn.data = function(name, value) {
    return value === undefined ?
      // set multiple values via object
      $.isPlainObject(name) ?
        this.each(function(i, node){
          $.each(name, function(key, value){ setData(node, key, value) })
        }) :
        // get value from first element
        this.length == 0 ? undefined : getData(this[0], name) :
      // set value on all elements
      this.each(function(){ setData(this, name, value) })
  }

  $.fn.removeData = function(names) {
    if (typeof names == 'string') names = names.split(/\s+/)
    return this.each(function(){
      var id = this[exp], store = id && data[id]
      if (store) $.each(names || store, function(key){
        delete store[names ? camelize(this) : key]
      })
    })
  }

  // Generate extended `remove` and `empty` functions
  ;['remove', 'empty'].forEach(function(methodName){
    var origFn = $.fn[methodName]
    $.fn[methodName] = function() {
      var elements = this.find('*')
      if (methodName === 'remove') elements = elements.add(this)
      elements.removeData()
      return origFn.call(this)
    }
  })
})(Zepto)
;
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);
;
/*!
 * Parse JavaScript SDK
 * Version: 1.2.18
 * Built: Wed Mar 12 2014 15:36:03
 * http://parse.com
 *
 * Copyright 2014 Parse, Inc.
 * The Parse JavaScript SDK is freely distributable under the MIT license.
 *
 * Includes: Underscore.js
 * Copyright 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * Released under the MIT license.
 */
(function(root) {
  root.Parse = root.Parse || {};
  root.Parse.VERSION = "js1.2.18";
}(this));
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

/*global _: false, $: false, localStorage: false, process: true,
  XMLHttpRequest: false, XDomainRequest: false, exports: false,
  require: false */
(function(root) {
  root.Parse = root.Parse || {};
  /**
   * Contains all Parse API classes and functions.
   * @name Parse
   * @namespace
   *
   * Contains all Parse API classes and functions.
   */
  var Parse = root.Parse;

  // Import Parse's local copy of underscore.
  if (typeof(exports) !== "undefined" && exports._) {
    // We're running in Node.js.  Pull in the dependencies.
    Parse._ = exports._.noConflict();
    Parse.localStorage = require('localStorage');
    Parse.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    exports.Parse = Parse;
  } else {
    Parse._ = _.noConflict();
    if (typeof(localStorage) !== "undefined") {
      Parse.localStorage = localStorage;
    }
    if (typeof(XMLHttpRequest) !== "undefined") {
      Parse.XMLHttpRequest = XMLHttpRequest;
    }
  }

  // If jQuery or Zepto has been included, grab a reference to it.
  if (typeof($) !== "undefined") {
    Parse.$ = $;
  }

  // Helpers
  // -------

  // Shared empty constructor function to aid in prototype-chain creation.
  var EmptyConstructor = function() {};

  
  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      /** @ignore */
      child = function(){ parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    Parse._.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    EmptyConstructor.prototype = parent.prototype;
    child.prototype = new EmptyConstructor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) {
      Parse._.extend(child.prototype, protoProps);
    }

    // Add static properties to the constructor function, if supplied.
    if (staticProps) {
      Parse._.extend(child, staticProps);
    }

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is
    // needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set the server for Parse to talk to.
  Parse.serverURL = "https://api.parse.com";

  // Check whether we are running in Node.js.
  if (typeof(process) !== "undefined" &&
      process.versions &&
      process.versions.node) {
    Parse._isNode = true;
  }

  /**
   * Call this method first to set up your authentication tokens for Parse.
   * You can get your keys from the Data Browser on parse.com.
   * @param {String} applicationId Your Parse Application ID.
   * @param {String} javaScriptKey Your Parse JavaScript Key.
   * @param {String} masterKey (optional) Your Parse Master Key. (Node.js only!)
   */
  Parse.initialize = function(applicationId, javaScriptKey, masterKey) {
    if (masterKey) {
      throw "Parse.initialize() was passed a Master Key, which is only " +
        "allowed from within Node.js.";
    }
    Parse._initialize(applicationId, javaScriptKey);
  };

  /**
   * Call this method first to set up master authentication tokens for Parse.
   * This method is for Parse's own private use.
   * @param {String} applicationId Your Parse Application ID.
   * @param {String} javaScriptKey Your Parse JavaScript Key.
   * @param {String} masterKey Your Parse Master Key.
   */
  Parse._initialize = function(applicationId, javaScriptKey, masterKey) {
    Parse.applicationId = applicationId;
    Parse.javaScriptKey = javaScriptKey;
    Parse.masterKey = masterKey;
    Parse._useMasterKey = false;
  };

  // If we're running in node.js, allow using the master key.
  if (Parse._isNode) {
    Parse.initialize = Parse._initialize;

    Parse.Cloud = Parse.Cloud || {};
    /**
     * Switches the Parse SDK to using the Master key.  The Master key grants
     * priveleged access to the data in Parse and can be used to bypass ACLs and
     * other restrictions that are applied to the client SDKs.
     * <p><strong><em>Available in Cloud Code and Node.js only.</em></strong>
     * </p>
     */
    Parse.Cloud.useMasterKey = function() {
      Parse._useMasterKey = true;
    };
  }

  /**
   * Returns prefix for localStorage keys used by this instance of Parse.
   * @param {String} path The relative suffix to append to it.
   *     null or undefined is treated as the empty string.
   * @return {String} The full key name.
   */
  Parse._getParsePath = function(path) {
    if (!Parse.applicationId) {
      throw "You need to call Parse.initialize before using Parse.";
    }
    if (!path) {
      path = "";
    }
    if (!Parse._.isString(path)) {
      throw "Tried to get a localStorage path that wasn't a String.";
    }
    if (path[0] === "/") {
      path = path.substring(1);
    }
    return "Parse/" + Parse.applicationId + "/" + path;
  };

  /**
   * Returns the unique string for this app on this machine.
   * Gets reset when localStorage is cleared.
   */
  Parse._installationId = null;
  Parse._getInstallationId = function() {
    // See if it's cached in RAM.
    if (Parse._installationId) {
      return Parse._installationId;
    }

    // Try to get it from localStorage.
    var path = Parse._getParsePath("installationId");
    Parse._installationId = Parse.localStorage.getItem(path);

    if (!Parse._installationId || Parse._installationId === "") {
      // It wasn't in localStorage, so create a new one.
      var hexOctet = function() {
        return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
      };
      Parse._installationId = (
        hexOctet() + hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + "-" +
        hexOctet() + hexOctet() + hexOctet());
      Parse.localStorage.setItem(path, Parse._installationId);
    }

    return Parse._installationId;
  };

  Parse._parseDate = function(iso8601) {
    var regexp = new RegExp(
      "^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" +
      "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" +
      "(.([0-9]+))?" + "Z$");
    var match = regexp.exec(iso8601);
    if (!match) {
      return null;
    }

    var year = match[1] || 0;
    var month = (match[2] || 1) - 1;
    var day = match[3] || 0;
    var hour = match[4] || 0;
    var minute = match[5] || 0;
    var second = match[6] || 0;
    var milli = match[8] || 0;

    return new Date(Date.UTC(year, month, day, hour, minute, second, milli));
  };

  Parse._ajaxIE8 = function(method, url, data) {
    var promise = new Parse.Promise();
    var xdr = new XDomainRequest();
    xdr.onload = function() {
      var response;
      try {
        response = JSON.parse(xdr.responseText);
      } catch (e) {
        promise.reject(e);
      }
      if (response) {
        promise.resolve(response);
      }
    };
    xdr.onerror = xdr.ontimeout = function() {
      // Let's fake a real error message.
      var fakeResponse = {
        responseText: JSON.stringify({
          code: Parse.Error.X_DOMAIN_REQUEST,
          error: "IE's XDomainRequest does not supply error info."
        })
      };
      promise.reject(fakeResponse);
    };
    xdr.onprogress = function() {};
    xdr.open(method, url);
    xdr.send(data);
    return promise;
  };

  Parse._useXDomainRequest = function() {
    if (typeof(XDomainRequest) !== "undefined") {
      // We're in IE 8+.
      if ('withCredentials' in new XMLHttpRequest()) {
        // We're in IE 10+.
        return false;
      }
      return true;
    }
    return false;
  };

  
  Parse._ajax = function(method, url, data, success, error) {
    var options = {
      success: success,
      error: error
    };

    if (Parse._useXDomainRequest()) {
      return Parse._ajaxIE8(method, url, data)._thenRunCallbacks(options);
    }

    var promise = new Parse.Promise();
    var handled = false;

    var xhr = new Parse.XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (handled) {
          return;
        }
        handled = true;

        if (xhr.status >= 200 && xhr.status < 300) {
          var response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            promise.reject(e);
          }
          if (response) {
            promise.resolve(response, xhr.status, xhr);
          }
        } else {
          promise.reject(xhr);
        }
      }
    };
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "text/plain");  // avoid pre-flight.
    if (Parse._isNode) {
      // Add a special user agent just for request from node.js.
      xhr.setRequestHeader("User-Agent",
                           "Parse/" + Parse.VERSION +
                           " (NodeJS " + process.versions.node + ")");
    }
    xhr.send(data);
    return promise._thenRunCallbacks(options);
  };

  // A self-propagating extend function.
  Parse._extend = function(protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  /**
   * Options:
   *   route: is classes, users, login, etc.
   *   objectId: null if there is no associated objectId.
   *   method: the http method for the REST API.
   *   dataObject: the payload as an object, or null if there is none.
   *   useMasterKey: overrides whether to use the master key if set.
   * @ignore
   */
  Parse._request = function(options) {
    var route = options.route;
    var className = options.className;
    var objectId = options.objectId;
    var method = options.method;
    var useMasterKey = options.useMasterKey;
    var sessionToken = options.sessionToken;
    var dataObject = options.data;

    if (!Parse.applicationId) {
      throw "You must specify your applicationId using Parse.initialize.";
    }

    if (!Parse.javaScriptKey && !Parse.masterKey) {
      throw "You must specify a key using Parse.initialize.";
    }

    
    if (!sessionToken) {
      // Use the current user session token if none was provided.
      var currentUser = Parse.User.current();
      if (currentUser && currentUser._sessionToken) {
        sessionToken = currentUser._sessionToken;
      }
    }

    
    if (route !== "batch" &&
        route !== "classes" &&
        route !== "events" &&
        route !== "files" &&
        route !== "functions" &&
        route !== "login" &&
        route !== "push" &&
        route !== "requestPasswordReset" &&
        route !== "rest_verify_analytics" &&
        route !== "users" &&
        route !== "jobs") {
      throw "Bad route: '" + route + "'.";
    }

    var url = Parse.serverURL;
    if (url.charAt(url.length - 1) !== "/") {
      url += "/";
    }
    url += "1/" + route;
    if (className) {
      url += "/" + className;
    }
    if (objectId) {
      url += "/" + objectId;
    }

    dataObject = Parse._.clone(dataObject || {});
    if (method !== "POST") {
      dataObject._method = method;
      method = "POST";
    }

    if (Parse._.isUndefined(useMasterKey)) {
      useMasterKey = Parse._useMasterKey;
    }

    dataObject._ApplicationId = Parse.applicationId;
    if (!useMasterKey) {
      dataObject._JavaScriptKey = Parse.javaScriptKey;
    } else {
      dataObject._MasterKey = Parse.masterKey;
    }

    dataObject._ClientVersion = Parse.VERSION;
    dataObject._InstallationId = Parse._getInstallationId();
    if (sessionToken) {
      dataObject._SessionToken = sessionToken;
    }
    var data = JSON.stringify(dataObject);

    return Parse._ajax(method, url, data).then(null, function(response) {
      // Transform the error into an instance of Parse.Error by trying to parse
      // the error string as JSON.
      var error;
      if (response && response.responseText) {
        try {
          var errorJSON = JSON.parse(response.responseText);
          error = new Parse.Error(errorJSON.code, errorJSON.error);
        } catch (e) {
          // If we fail to parse the error text, that's okay.
          error = new Parse.Error(
              Parse.Error.INVALID_JSON,
              "Received an error with invalid JSON from Parse: " +
                  response.responseText);
        }
      } else {
        error = new Parse.Error(
            Parse.Error.CONNECTION_FAILED,
            "XMLHttpRequest failed: " + JSON.stringify(response));
      }
      // By explicitly returning a rejected Promise, this will work with
      // either jQuery or Promises/A semantics.
      return Parse.Promise.error(error);
    });
  };

  // Helper function to get a value from a Backbone object as a property
  // or as a function.
  Parse._getValue = function(object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    return Parse._.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  /**
   * Converts a value in a Parse Object into the appropriate representation.
   * This is the JS equivalent of Java's Parse.maybeReferenceAndEncode(Object)
   * if seenObjects is falsey. Otherwise any Parse.Objects not in
   * seenObjects will be fully embedded rather than encoded
   * as a pointer.  This array will be used to prevent going into an infinite
   * loop because we have circular references.  If seenObjects
   * is set, then none of the Parse Objects that are serialized can be dirty.
   */
  Parse._encode = function(value, seenObjects, disallowObjects) {
    var _ = Parse._;
    if (value instanceof Parse.Object) {
      if (disallowObjects) {
        throw "Parse.Objects not allowed here";
      }
      if (!seenObjects || _.include(seenObjects, value) || !value._hasData) {
        return value._toPointer();
      }
      if (!value.dirty()) {
        seenObjects = seenObjects.concat(value);
        return Parse._encode(value._toFullJSON(seenObjects),
                             seenObjects,
                             disallowObjects);
      }
      throw "Tried to save an object with a pointer to a new, unsaved object.";
    }
    if (value instanceof Parse.ACL) {
      return value.toJSON();
    }
    if (_.isDate(value)) {
      return { "__type": "Date", "iso": value.toJSON() };
    }
    if (value instanceof Parse.GeoPoint) {
      return value.toJSON();
    }
    if (_.isArray(value)) {
      return _.map(value, function(x) {
        return Parse._encode(x, seenObjects, disallowObjects);
      });
    }
    if (_.isRegExp(value)) {
      return value.source;
    }
    if (value instanceof Parse.Relation) {
      return value.toJSON();
    }
    if (value instanceof Parse.Op) {
      return value.toJSON();
    }
    if (value instanceof Parse.File) {
      if (!value.url()) {
        throw "Tried to save an object containing an unsaved file.";
      }
      return {
        __type: "File",
        name: value.name(),
        url: value.url()
      };
    }
    if (_.isObject(value)) {
      var output = {};
      Parse._objectEach(value, function(v, k) {
        output[k] = Parse._encode(v, seenObjects, disallowObjects);
      });
      return output;
    }
    return value;
  };

  /**
   * The inverse function of Parse._encode.
   * TODO: make decode not mutate value.
   */
  Parse._decode = function(key, value) {
    var _ = Parse._;
    if (!_.isObject(value)) {
      return value;
    }
    if (_.isArray(value)) {
      Parse._arrayEach(value, function(v, k) {
        value[k] = Parse._decode(k, v);
      });
      return value;
    }
    if (value instanceof Parse.Object) {
      return value;
    }
    if (value instanceof Parse.File) {
      return value;
    }
    if (value instanceof Parse.Op) {
      return value;
    }
    if (value.__op) {
      return Parse.Op._decode(value);
    }
    if (value.__type === "Pointer") {
      var pointer = Parse.Object._create(value.className);
      pointer._finishFetch({ objectId: value.objectId }, false);
      return pointer;
    }
    if (value.__type === "Object") {
      // It's an Object included in a query result.
      var className = value.className;
      delete value.__type;
      delete value.className;
      var object = Parse.Object._create(className);
      object._finishFetch(value, true);
      return object;
    }
    if (value.__type === "Date") {
      return Parse._parseDate(value.iso);
    }
    if (value.__type === "GeoPoint") {
      return new Parse.GeoPoint({
        latitude: value.latitude,
        longitude: value.longitude
      });
    }
    if (key === "ACL") {
      if (value instanceof Parse.ACL) {
        return value;
      }
      return new Parse.ACL(value);
    }
    if (value.__type === "Relation") {
      var relation = new Parse.Relation(null, key);
      relation.targetClassName = value.className;
      return relation;
    }
    if (value.__type === "File") {
      var file = new Parse.File(value.name);
      file._url = value.url;
      return file;
    }
    Parse._objectEach(value, function(v, k) {
      value[k] = Parse._decode(k, v);
    });
    return value;
  };

  Parse._arrayEach = Parse._.each;

  /**
   * Does a deep traversal of every item in object, calling func on every one.
   * @param {Object} object The object or array to traverse deeply.
   * @param {Function} func The function to call for every item. It will
   *     be passed the item as an argument. If it returns a truthy value, that
   *     value will replace the item in its parent container.
   * @returns {} the result of calling func on the top-level object itself.
   */
  Parse._traverse = function(object, func, seen) {
    if (object instanceof Parse.Object) {
      seen = seen || [];
      if (Parse._.indexOf(seen, object) >= 0) {
        // We've already visited this object in this call.
        return;
      }
      seen.push(object);
      Parse._traverse(object.attributes, func, seen);
      return func(object);
    }
    if (object instanceof Parse.Relation || object instanceof Parse.File) {
      // Nothing needs to be done, but we don't want to recurse into the
      // object's parent infinitely, so we catch this case.
      return func(object);
    }
    if (Parse._.isArray(object)) {
      Parse._.each(object, function(child, index) {
        var newChild = Parse._traverse(child, func, seen);
        if (newChild) {
          object[index] = newChild;
        }
      });
      return func(object);
    }
    if (Parse._.isObject(object)) {
      Parse._each(object, function(child, key) {
        var newChild = Parse._traverse(child, func, seen);
        if (newChild) {
          object[key] = newChild;
        }
      });
      return func(object);
    }
    return func(object);
  };

  /**
   * This is like _.each, except:
   * * it doesn't work for so-called array-like objects,
   * * it does work for dictionaries with a "length" attribute.
   */
  Parse._objectEach = Parse._each = function(obj, callback) {
    var _ = Parse._;
    if (_.isObject(obj)) {
      _.each(_.keys(obj), function(key) {
        callback(obj[key], key);
      });
    } else {
      _.each(obj, callback);
    }
  };

  // Helper function to check null or undefined.
  Parse._isNullOrUndefined = function(x) {
    return Parse._.isNull(x) || Parse._.isUndefined(x);
  };
}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * @namespace Provides an interface to Parse's logging and analytics backend.
   */
  Parse.Analytics = Parse.Analytics || {};

  _.extend(Parse.Analytics, /** @lends Parse.Analytics */ {
    /**
     * Tracks the occurrence of a custom event with additional dimensions.
     * Parse will store a data point at the time of invocation with the given
     * event name.
     *
     * Dimensions will allow segmentation of the occurrences of this custom
     * event. Keys and values should be {@code String}s, and will throw
     * otherwise.
     *
     * To track a user signup along with additional metadata, consider the
     * following:
     * <pre>
     * var dimensions = {
     *  gender: 'm',
     *  source: 'web',
     *  dayType: 'weekend'
     * };
     * Parse.Analytics.track('signup', dimensions);
     * </pre>
     *
     * There is a default limit of 4 dimensions per event tracked.
     *
     * @param {String} name The name of the custom event to report to Parse as
     * having happened.
     * @param {Object} dimensions The dictionary of information by which to
     * segment this event.
     * @return {Parse.Promise} A promise that is resolved when the round-trip
     * to the server completes.
     */
    track: function(name, dimensions) {
      name = name || '';
      name = name.replace(/^\s*/, '');
      name = name.replace(/\s*$/, '');
      if (name.length === 0) {
        throw 'A name for the custom event must be provided';
      }

      _.each(dimensions, function(val, key) {
        if (!_.isString(key) || !_.isString(val)) {
          throw 'track() dimensions expects keys and values of type "string".';
        }
      });

      return Parse._request({
        route: 'events',
        className: name,
        method: 'POST',
        data: { dimensions: dimensions }
      });
    }
  });
}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Constructs a new Parse.Error object with the given code and message.
   * @param {Number} code An error code constant from <code>Parse.Error</code>.
   * @param {String} message A detailed description of the error.
   * @class
   *
   * <p>Class used for all objects passed to error callbacks.</p>
   */
  Parse.Error = function(code, message) {
    this.code = code;
    this.message = message;
  };

  _.extend(Parse.Error, /** @lends Parse.Error */ {
    /**
     * Error code indicating some error other than those enumerated here.
     * @constant
     */
    OTHER_CAUSE: -1,

    /**
     * Error code indicating that something has gone wrong with the server.
     * If you get this error code, it is Parse's fault. Contact us at 
     * https://parse.com/help
     * @constant
     */
    INTERNAL_SERVER_ERROR: 1,

    /**
     * Error code indicating the connection to the Parse servers failed.
     * @constant
     */
    CONNECTION_FAILED: 100,

    /**
     * Error code indicating the specified object doesn't exist.
     * @constant
     */
    OBJECT_NOT_FOUND: 101,

    /**
     * Error code indicating you tried to query with a datatype that doesn't
     * support it, like exact matching an array or object.
     * @constant
     */
    INVALID_QUERY: 102,

    /**
     * Error code indicating a missing or invalid classname. Classnames are
     * case-sensitive. They must start with a letter, and a-zA-Z0-9_ are the
     * only valid characters.
     * @constant
     */
    INVALID_CLASS_NAME: 103,

    /**
     * Error code indicating an unspecified object id.
     * @constant
     */
    MISSING_OBJECT_ID: 104,

    /**
     * Error code indicating an invalid key name. Keys are case-sensitive. They
     * must start with a letter, and a-zA-Z0-9_ are the only valid characters.
     * @constant
     */
    INVALID_KEY_NAME: 105,

    /**
     * Error code indicating a malformed pointer. You should not see this unless
     * you have been mucking about changing internal Parse code.
     * @constant
     */
    INVALID_POINTER: 106,

    /**
     * Error code indicating that badly formed JSON was received upstream. This
     * either indicates you have done something unusual with modifying how
     * things encode to JSON, or the network is failing badly.
     * @constant
     */
    INVALID_JSON: 107,

    /**
     * Error code indicating that the feature you tried to access is only
     * available internally for testing purposes.
     * @constant
     */
    COMMAND_UNAVAILABLE: 108,

    /**
     * You must call Parse.initialize before using the Parse library.
     * @constant
     */
    NOT_INITIALIZED: 109,

    /**
     * Error code indicating that a field was set to an inconsistent type.
     * @constant
     */
    INCORRECT_TYPE: 111,

    /**
     * Error code indicating an invalid channel name. A channel name is either
     * an empty string (the broadcast channel) or contains only a-zA-Z0-9_
     * characters and starts with a letter.
     * @constant
     */
    INVALID_CHANNEL_NAME: 112,

    /**
     * Error code indicating that push is misconfigured.
     * @constant
     */
    PUSH_MISCONFIGURED: 115,

    /**
     * Error code indicating that the object is too large.
     * @constant
     */
    OBJECT_TOO_LARGE: 116,

    /**
     * Error code indicating that the operation isn't allowed for clients.
     * @constant
     */
    OPERATION_FORBIDDEN: 119,

    /**
     * Error code indicating the result was not found in the cache.
     * @constant
     */
    CACHE_MISS: 120,

    /**
     * Error code indicating that an invalid key was used in a nested
     * JSONObject.
     * @constant
     */
    INVALID_NESTED_KEY: 121,

    /**
     * Error code indicating that an invalid filename was used for ParseFile.
     * A valid file name contains only a-zA-Z0-9_. characters and is between 1
     * and 128 characters.
     * @constant
     */
    INVALID_FILE_NAME: 122,

    /**
     * Error code indicating an invalid ACL was provided.
     * @constant
     */
    INVALID_ACL: 123,

    /**
     * Error code indicating that the request timed out on the server. Typically
     * this indicates that the request is too expensive to run.
     * @constant
     */
    TIMEOUT: 124,

    /**
     * Error code indicating that the email address was invalid.
     * @constant
     */
    INVALID_EMAIL_ADDRESS: 125,

    /**
     * Error code indicating a missing content type.
     * @constant
     */
    MISSING_CONTENT_TYPE: 126,

    /**
     * Error code indicating a missing content length.
     * @constant
     */
    MISSING_CONTENT_LENGTH: 127,

    /**
     * Error code indicating an invalid content length.
     * @constant
     */
    INVALID_CONTENT_LENGTH: 128,

    /**
     * Error code indicating a file that was too large.
     * @constant
     */
    FILE_TOO_LARGE: 129,

    /**
     * Error code indicating an error saving a file.
     * @constant
     */
    FILE_SAVE_ERROR: 130,

    /**
     * Error code indicating an error deleting a file.
     * @constant
     */
    FILE_DELETE_ERROR: 153,

    /**
     * Error code indicating that a unique field was given a value that is
     * already taken.
     * @constant
     */
    DUPLICATE_VALUE: 137,

    /**
     * Error code indicating that a role's name is invalid.
     * @constant
     */
    INVALID_ROLE_NAME: 139,

    /**
     * Error code indicating that an application quota was exceeded.  Upgrade to
     * resolve.
     * @constant
     */
    EXCEEDED_QUOTA: 140,

    /**
     * Error code indicating that a Cloud Code script failed.
     * @constant
     */
    SCRIPT_FAILED: 141,

    /**
     * Error code indicating that a Cloud Code validation failed.
     * @constant
     */
    VALIDATION_ERROR: 142,

    /**
     * Error code indicating that invalid image data was provided.
     * @constant
     */
    INVALID_IMAGE_DATA: 150,

    /**
     * Error code indicating an unsaved file.
     * @constant
     */
    UNSAVED_FILE_ERROR: 151,

    /**
     * Error code indicating an invalid push time.
     */
    INVALID_PUSH_TIME_ERROR: 152,

    /**
     * Error code indicating that the username is missing or empty.
     * @constant
     */
    USERNAME_MISSING: 200,

    /**
     * Error code indicating that the password is missing or empty.
     * @constant
     */
    PASSWORD_MISSING: 201,

    /**
     * Error code indicating that the username has already been taken.
     * @constant
     */
    USERNAME_TAKEN: 202,

    /**
     * Error code indicating that the email has already been taken.
     * @constant
     */
    EMAIL_TAKEN: 203,

    /**
     * Error code indicating that the email is missing, but must be specified.
     * @constant
     */
    EMAIL_MISSING: 204,

    /**
     * Error code indicating that a user with the specified email was not found.
     * @constant
     */
    EMAIL_NOT_FOUND: 205,

    /**
     * Error code indicating that a user object without a valid session could
     * not be altered.
     * @constant
     */
    SESSION_MISSING: 206,

    /**
     * Error code indicating that a user can only be created through signup.
     * @constant
     */
    MUST_CREATE_USER_THROUGH_SIGNUP: 207,

    /**
     * Error code indicating that an an account being linked is already linked
     * to another user.
     * @constant
     */
    ACCOUNT_ALREADY_LINKED: 208,

    /**
     * Error code indicating that a user cannot be linked to an account because
     * that account's id could not be found.
     * @constant
     */
    LINKED_ID_MISSING: 250,

    /**
     * Error code indicating that a user with a linked (e.g. Facebook) account
     * has an invalid session.
     * @constant
     */
    INVALID_LINKED_SESSION: 251,

    /**
     * Error code indicating that a service being linked (e.g. Facebook or
     * Twitter) is unsupported.
     * @constant
     */
    UNSUPPORTED_SERVICE: 252,

    /**
     * Error code indicating that there were multiple errors. Aggregate errors
     * have an "errors" property, which is an array of error objects with more
     * detail about each error that occurred.
     * @constant
     */
    AGGREGATE_ERROR: 600,

    /**
     * Error code indicating the client was unable to read an input file.
     * @constant
     */
    FILE_READ_ERROR: 601,

    /**
     * Error code indicating a real error code is unavailable because
     * we had to use an XDomainRequest object to allow CORS requests in
     * Internet Explorer, which strips the body from HTTP responses that have
     * a non-2XX status code.
     * @constant
     */
    X_DOMAIN_REQUEST: 602
  });

}(this));

/*global _: false */
(function() {
  var root = this;
  var Parse = (root.Parse || (root.Parse = {}));
  var eventSplitter = /\s+/;
  var slice = Array.prototype.slice;

  /**
   * @class
   *
   * <p>Parse.Events is a fork of Backbone's Events module, provided for your
   * convenience.</p>
   *
   * <p>A module that can be mixed in to any object in order to provide
   * it with custom events. You may bind callback functions to an event
   * with `on`, or remove these functions with `off`.
   * Triggering an event fires all callbacks in the order that `on` was
   * called.
   *
   * <pre>
   *     var object = {};
   *     _.extend(object, Parse.Events);
   *     object.on('expand', function(){ alert('expanded'); });
   *     object.trigger('expand');</pre></p>
   *
   * <p>For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#Events">Backbone
   * documentation</a>.</p>
   */
  Parse.Events = {
    /**
     * Bind one or more space separated events, `events`, to a `callback`
     * function. Passing `"all"` will bind the callback to all events fired.
     */
    on: function(events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) {
        return this;
      }
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      event = events.shift();
      while (event) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
        event = events.shift();
      }

      return this;
    },

    /**
     * Remove one or many callbacks. If `context` is null, removes all callbacks
     * with that function. If `callback` is null, removes all callbacks for the
     * event. If `events` is null, removes all bound callbacks for all events.
     */
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) {
        return;
      }
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      event = events.shift();
      while (event) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) {
          continue;
        }
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        node = node.next;
        while (node !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
          node = node.next;
        }
        event = events.shift();
      }

      return this;
    },

    /**
     * Trigger one or many events, firing all bound callbacks. Callbacks are
     * passed the same arguments as `trigger` is, apart from the event name
     * (unless you're listening on `"all"`, which will cause your callback to
     * receive the true name of the event as the first argument).
     */
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) {
        return this;
      }
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      event = events.shift();
      while (event) {
        node = calls[event];
        if (node) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        node = all;
        if (node) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
        event = events.shift();
      }

      return this;
    }
  };  

  /**
   * @function
   */
  Parse.Events.bind = Parse.Events.on;

  /**
   * @function
   */
  Parse.Events.unbind = Parse.Events.off;
}.call(this));


/*global navigator: false */
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creates a new GeoPoint with any of the following forms:<br>
   *   <pre>
   *   new GeoPoint(otherGeoPoint)
   *   new GeoPoint(30, 30)
   *   new GeoPoint([30, 30])
   *   new GeoPoint({latitude: 30, longitude: 30})
   *   new GeoPoint()  // defaults to (0, 0)
   *   </pre>
   * @class
   *
   * <p>Represents a latitude / longitude point that may be associated
   * with a key in a ParseObject or used as a reference point for geo queries.
   * This allows proximity-based queries on the key.</p>
   *
   * <p>Only one key in a class may contain a GeoPoint.</p>
   *
   * <p>Example:<pre>
   *   var point = new Parse.GeoPoint(30.0, -20.0);
   *   var object = new Parse.Object("PlaceObject");
   *   object.set("location", point);
   *   object.save();</pre></p>
   */
  Parse.GeoPoint = function(arg1, arg2) {
    if (_.isArray(arg1)) {
      Parse.GeoPoint._validate(arg1[0], arg1[1]);
      this.latitude = arg1[0];
      this.longitude = arg1[1];
    } else if (_.isObject(arg1)) {
      Parse.GeoPoint._validate(arg1.latitude, arg1.longitude);
      this.latitude = arg1.latitude;
      this.longitude = arg1.longitude;
    } else if (_.isNumber(arg1) && _.isNumber(arg2)) {
      Parse.GeoPoint._validate(arg1, arg2);
      this.latitude = arg1;
      this.longitude = arg2;
    } else {
      this.latitude = 0;
      this.longitude = 0;
    }

    // Add properties so that anyone using Webkit or Mozilla will get an error
    // if they try to set values that are out of bounds.
    var self = this;
    if (this.__defineGetter__ && this.__defineSetter__) {
      // Use _latitude and _longitude to actually store the values, and add
      // getters and setters for latitude and longitude.
      this._latitude = this.latitude;
      this._longitude = this.longitude;
      this.__defineGetter__("latitude", function() {
        return self._latitude;
      });
      this.__defineGetter__("longitude", function() {
        return self._longitude;
      });
      this.__defineSetter__("latitude", function(val) {
        Parse.GeoPoint._validate(val, self.longitude);
        self._latitude = val;
      });
      this.__defineSetter__("longitude", function(val) {
        Parse.GeoPoint._validate(self.latitude, val);
        self._longitude = val;
      });
    }
  };

  /**
   * @lends Parse.GeoPoint.prototype
   * @property {float} latitude North-south portion of the coordinate, in range
   *   [-90, 90].  Throws an exception if set out of range in a modern browser.
   * @property {float} longitude East-west portion of the coordinate, in range
   *   [-180, 180].  Throws if set out of range in a modern browser.
   */

  /**
   * Throws an exception if the given lat-long is out of bounds.
   */
  Parse.GeoPoint._validate = function(latitude, longitude) {
    if (latitude < -90.0) {
      throw "Parse.GeoPoint latitude " + latitude + " < -90.0.";
    }
    if (latitude > 90.0) {
      throw "Parse.GeoPoint latitude " + latitude + " > 90.0.";
    }
    if (longitude < -180.0) {
      throw "Parse.GeoPoint longitude " + longitude + " < -180.0.";
    }
    if (longitude > 180.0) {
      throw "Parse.GeoPoint longitude " + longitude + " > 180.0.";
    }
  };

  /**
   * Creates a GeoPoint with the user's current location, if available.
   * Calls options.success with a new GeoPoint instance or calls options.error.
   * @param {Object} options An object with success and error callbacks.
   */
  Parse.GeoPoint.current = function(options) {
    var promise = new Parse.Promise();
    navigator.geolocation.getCurrentPosition(function(location) {
      promise.resolve(new Parse.GeoPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }));

    }, function(error) {
      promise.reject(error);
    });

    return promise._thenRunCallbacks(options);
  };

  Parse.GeoPoint.prototype = {
    /**
     * Returns a JSON representation of the GeoPoint, suitable for Parse.
     * @return {Object}
     */
    toJSON: function() {
      Parse.GeoPoint._validate(this.latitude, this.longitude);
      return {
        "__type": "GeoPoint",
        latitude: this.latitude,
        longitude: this.longitude
      };
    },

    /**
     * Returns the distance from this GeoPoint to another in radians.
     * @param {Parse.GeoPoint} point the other Parse.GeoPoint.
     * @return {Number}
     */
    radiansTo: function(point) {
      var d2r = Math.PI / 180.0;
      var lat1rad = this.latitude * d2r;
      var long1rad = this.longitude * d2r;
      var lat2rad = point.latitude * d2r;
      var long2rad = point.longitude * d2r;
      var deltaLat = lat1rad - lat2rad;
      var deltaLong = long1rad - long2rad;
      var sinDeltaLatDiv2 = Math.sin(deltaLat / 2);
      var sinDeltaLongDiv2 = Math.sin(deltaLong / 2);
      // Square of half the straight line chord distance between both points.
      var a = ((sinDeltaLatDiv2 * sinDeltaLatDiv2) +
               (Math.cos(lat1rad) * Math.cos(lat2rad) *
                sinDeltaLongDiv2 * sinDeltaLongDiv2));
      a = Math.min(1.0, a);
      return 2 * Math.asin(Math.sqrt(a));
    },

    /**
     * Returns the distance from this GeoPoint to another in kilometers.
     * @param {Parse.GeoPoint} point the other Parse.GeoPoint.
     * @return {Number}
     */
    kilometersTo: function(point) {
      return this.radiansTo(point) * 6371.0;
    },

    /**
     * Returns the distance from this GeoPoint to another in miles.
     * @param {Parse.GeoPoint} point the other Parse.GeoPoint.
     * @return {Number}
     */
    milesTo: function(point) {
      return this.radiansTo(point) * 3958.8;
    }
  };
}(this));

/*global navigator: false */
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  var PUBLIC_KEY = "*";

  /**
   * Creates a new ACL.
   * If no argument is given, the ACL has no permissions for anyone.
   * If the argument is a Parse.User, the ACL will have read and write
   *   permission for only that user.
   * If the argument is any other JSON object, that object will be interpretted
   *   as a serialized ACL created with toJSON().
   * @see Parse.Object#setACL
   * @class
   *
   * <p>An ACL, or Access Control List can be added to any
   * <code>Parse.Object</code> to restrict access to only a subset of users
   * of your application.</p>
   */
  Parse.ACL = function(arg1) {
    var self = this;
    self.permissionsById = {};
    if (_.isObject(arg1)) {
      if (arg1 instanceof Parse.User) {
        self.setReadAccess(arg1, true);
        self.setWriteAccess(arg1, true);
      } else {
        if (_.isFunction(arg1)) {
          throw "Parse.ACL() called with a function.  Did you forget ()?";
        }
        Parse._objectEach(arg1, function(accessList, userId) {
          if (!_.isString(userId)) {
            throw "Tried to create an ACL with an invalid userId.";
          }
          self.permissionsById[userId] = {};
          Parse._objectEach(accessList, function(allowed, permission) {
            if (permission !== "read" && permission !== "write") {
              throw "Tried to create an ACL with an invalid permission type.";
            }
            if (!_.isBoolean(allowed)) {
              throw "Tried to create an ACL with an invalid permission value.";
            }
            self.permissionsById[userId][permission] = allowed;
          });
        });
      }
    }
  };

  /**
   * Returns a JSON-encoded version of the ACL.
   * @return {Object}
   */
  Parse.ACL.prototype.toJSON = function() {
    return _.clone(this.permissionsById);
  };

  Parse.ACL.prototype._setAccess = function(accessType, userId, allowed) {
    if (userId instanceof Parse.User) {
      userId = userId.id;
    } else if (userId instanceof Parse.Role) {
      userId = "role:" + userId.getName();
    }
    if (!_.isString(userId)) {
      throw "userId must be a string.";
    }
    if (!_.isBoolean(allowed)) {
      throw "allowed must be either true or false.";
    }
    var permissions = this.permissionsById[userId];
    if (!permissions) {
      if (!allowed) {
        // The user already doesn't have this permission, so no action needed.
        return;
      } else {
        permissions = {};
        this.permissionsById[userId] = permissions;
      }
    }

    if (allowed) {
      this.permissionsById[userId][accessType] = true;
    } else {
      delete permissions[accessType];
      if (_.isEmpty(permissions)) {
        delete permissions[userId];
      }
    }
  };

  Parse.ACL.prototype._getAccess = function(accessType, userId) {
    if (userId instanceof Parse.User) {
      userId = userId.id;
    } else if (userId instanceof Parse.Role) {
      userId = "role:" + userId.getName();
    }
    var permissions = this.permissionsById[userId];
    if (!permissions) {
      return false;
    }
    return permissions[accessType] ? true : false;
  };

  /**
   * Set whether the given user is allowed to read this object.
   * @param userId An instance of Parse.User or its objectId.
   * @param {Boolean} allowed Whether that user should have read access.
   */
  Parse.ACL.prototype.setReadAccess = function(userId, allowed) {
    this._setAccess("read", userId, allowed);
  };

  /**
   * Get whether the given user id is *explicitly* allowed to read this object.
   * Even if this returns false, the user may still be able to access it if
   * getPublicReadAccess returns true or a role that the user belongs to has
   * write access.
   * @param userId An instance of Parse.User or its objectId, or a Parse.Role.
   * @return {Boolean}
   */
  Parse.ACL.prototype.getReadAccess = function(userId) {
    return this._getAccess("read", userId);
  };

  /**
   * Set whether the given user id is allowed to write this object.
   * @param userId An instance of Parse.User or its objectId, or a Parse.Role..
   * @param {Boolean} allowed Whether that user should have write access.
   */
  Parse.ACL.prototype.setWriteAccess = function(userId, allowed) {
    this._setAccess("write", userId, allowed);
  };

  /**
   * Get whether the given user id is *explicitly* allowed to write this object.
   * Even if this returns false, the user may still be able to write it if
   * getPublicWriteAccess returns true or a role that the user belongs to has
   * write access.
   * @param userId An instance of Parse.User or its objectId, or a Parse.Role.
   * @return {Boolean}
   */
  Parse.ACL.prototype.getWriteAccess = function(userId) {
    return this._getAccess("write", userId);
  };

  /**
   * Set whether the public is allowed to read this object.
   * @param {Boolean} allowed
   */
  Parse.ACL.prototype.setPublicReadAccess = function(allowed) {
    this.setReadAccess(PUBLIC_KEY, allowed);
  };

  /**
   * Get whether the public is allowed to read this object.
   * @return {Boolean}
   */
  Parse.ACL.prototype.getPublicReadAccess = function() {
    return this.getReadAccess(PUBLIC_KEY);
  };

  /**
   * Set whether the public is allowed to write this object.
   * @param {Boolean} allowed
   */
  Parse.ACL.prototype.setPublicWriteAccess = function(allowed) {
    this.setWriteAccess(PUBLIC_KEY, allowed);
  };

  /**
   * Get whether the public is allowed to write this object.
   * @return {Boolean}
   */
  Parse.ACL.prototype.getPublicWriteAccess = function() {
    return this.getWriteAccess(PUBLIC_KEY);
  };
  
  /**
   * Get whether users belonging to the given role are allowed
   * to read this object. Even if this returns false, the role may
   * still be able to write it if a parent role has read access.
   * 
   * @param role The name of the role, or a Parse.Role object.
   * @return {Boolean} true if the role has read access. false otherwise.
   * @throws {String} If role is neither a Parse.Role nor a String.
   */
  Parse.ACL.prototype.getRoleReadAccess = function(role) {
    if (role instanceof Parse.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      return this.getReadAccess("role:" + role);
    }
    throw "role must be a Parse.Role or a String";
  };
  
  /**
   * Get whether users belonging to the given role are allowed
   * to write this object. Even if this returns false, the role may
   * still be able to write it if a parent role has write access.
   * 
   * @param role The name of the role, or a Parse.Role object.
   * @return {Boolean} true if the role has write access. false otherwise.
   * @throws {String} If role is neither a Parse.Role nor a String.
   */
  Parse.ACL.prototype.getRoleWriteAccess = function(role) {
    if (role instanceof Parse.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      return this.getWriteAccess("role:" + role);
    }
    throw "role must be a Parse.Role or a String";
  };
  
  /**
   * Set whether users belonging to the given role are allowed
   * to read this object.
   * 
   * @param role The name of the role, or a Parse.Role object.
   * @param {Boolean} allowed Whether the given role can read this object.
   * @throws {String} If role is neither a Parse.Role nor a String.
   */
  Parse.ACL.prototype.setRoleReadAccess = function(role, allowed) {
    if (role instanceof Parse.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      this.setReadAccess("role:" + role, allowed);
      return;
    }
    throw "role must be a Parse.Role or a String";
  };
  
  /**
   * Set whether users belonging to the given role are allowed
   * to write this object.
   * 
   * @param role The name of the role, or a Parse.Role object.
   * @param {Boolean} allowed Whether the given role can write this object.
   * @throws {String} If role is neither a Parse.Role nor a String.
   */
  Parse.ACL.prototype.setRoleWriteAccess = function(role, allowed) {
    if (role instanceof Parse.Role) {
      // Normalize to the String name
      role = role.getName();
    }
    if (_.isString(role)) {
      this.setWriteAccess("role:" + role, allowed);
      return;
    }
    throw "role must be a Parse.Role or a String";
  };

}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * @class
   * A Parse.Op is an atomic operation that can be applied to a field in a
   * Parse.Object. For example, calling <code>object.set("foo", "bar")</code>
   * is an example of a Parse.Op.Set. Calling <code>object.unset("foo")</code>
   * is a Parse.Op.Unset. These operations are stored in a Parse.Object and
   * sent to the server as part of <code>object.save()</code> operations.
   * Instances of Parse.Op should be immutable.
   *
   * You should not create subclasses of Parse.Op or instantiate Parse.Op
   * directly.
   */
  Parse.Op = function() {
    this._initialize.apply(this, arguments);
  };

  Parse.Op.prototype = {
    _initialize: function() {}
  };

  _.extend(Parse.Op, {
    /**
     * To create a new Op, call Parse.Op._extend();
     */
    _extend: Parse._extend,

    // A map of __op string to decoder function.
    _opDecoderMap: {},

    /**
     * Registers a function to convert a json object with an __op field into an
     * instance of a subclass of Parse.Op.
     */
    _registerDecoder: function(opName, decoder) {
      Parse.Op._opDecoderMap[opName] = decoder;
    },

    /**
     * Converts a json object into an instance of a subclass of Parse.Op.
     */
    _decode: function(json) {
      var decoder = Parse.Op._opDecoderMap[json.__op];
      if (decoder) {
        return decoder(json);
      } else {
        return undefined;
      }
    }
  });

  /*
   * Add a handler for Batch ops.
   */
  Parse.Op._registerDecoder("Batch", function(json) {
    var op = null;
    Parse._arrayEach(json.ops, function(nextOp) {
      nextOp = Parse.Op._decode(nextOp);
      op = nextOp._mergeWithPrevious(op);
    });
    return op;
  });

  /**
   * @class
   * A Set operation indicates that either the field was changed using
   * Parse.Object.set, or it is a mutable container that was detected as being
   * changed.
   */
  Parse.Op.Set = Parse.Op._extend(/** @lends Parse.Op.Set.prototype */ {
    _initialize: function(value) {
      this._value = value;
    },

    /**
     * Returns the new value of this field after the set.
     */
    value: function() {
      return this._value;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      return Parse._encode(this.value());
    },

    _mergeWithPrevious: function(previous) {
      return this;
    },

    _estimate: function(oldValue) {
      return this.value();
    }
  });

  /**
   * A sentinel value that is returned by Parse.Op.Unset._estimate to
   * indicate the field should be deleted. Basically, if you find _UNSET as a
   * value in your object, you should remove that key.
   */
  Parse.Op._UNSET = {};

  /**
   * @class
   * An Unset operation indicates that this field has been deleted from the
   * object.
   */
  Parse.Op.Unset = Parse.Op._extend(/** @lends Parse.Op.Unset.prototype */ {
    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Delete" };
    },

    _mergeWithPrevious: function(previous) {
      return this;
    },

    _estimate: function(oldValue) {
      return Parse.Op._UNSET;
    }
  });

  Parse.Op._registerDecoder("Delete", function(json) {
    return new Parse.Op.Unset();
  });

  /**
   * @class
   * An Increment is an atomic operation where the numeric value for the field
   * will be increased by a given amount.
   */
  Parse.Op.Increment = Parse.Op._extend(
      /** @lends Parse.Op.Increment.prototype */ {

    _initialize: function(amount) {
      this._amount = amount;
    },

    /**
     * Returns the amount to increment by.
     * @return {Number} the amount to increment by.
     */
    amount: function() {
      return this._amount;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Increment", amount: this._amount };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof Parse.Op.Unset) {
        return new Parse.Op.Set(this.amount());
      } else if (previous instanceof Parse.Op.Set) {
        return new Parse.Op.Set(previous.value() + this.amount());
      } else if (previous instanceof Parse.Op.Increment) {
        return new Parse.Op.Increment(this.amount() + previous.amount());
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return this.amount();
      }
      return oldValue + this.amount();
    }
  });

  Parse.Op._registerDecoder("Increment", function(json) {
    return new Parse.Op.Increment(json.amount);
  });

  /**
   * @class
   * Add is an atomic operation where the given objects will be appended to the
   * array that is stored in this field.
   */
  Parse.Op.Add = Parse.Op._extend(/** @lends Parse.Op.Add.prototype */ {
    _initialize: function(objects) {
      this._objects = objects;
    },

    /**
     * Returns the objects to be added to the array.
     * @return {Array} The objects to be added to the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Add", objects: Parse._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof Parse.Op.Unset) {
        return new Parse.Op.Set(this.objects());
      } else if (previous instanceof Parse.Op.Set) {
        return new Parse.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof Parse.Op.Add) {
        return new Parse.Op.Add(previous.objects().concat(this.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return _.clone(this.objects());
      } else {
        return oldValue.concat(this.objects());
      }
    }
  });

  Parse.Op._registerDecoder("Add", function(json) {
    return new Parse.Op.Add(Parse._decode(undefined, json.objects));
  });

  /**
   * @class
   * AddUnique is an atomic operation where the given items will be appended to
   * the array that is stored in this field only if they were not already
   * present in the array.
   */
  Parse.Op.AddUnique = Parse.Op._extend(
      /** @lends Parse.Op.AddUnique.prototype */ {

    _initialize: function(objects) {
      this._objects = _.uniq(objects);
    },

    /**
     * Returns the objects to be added to the array.
     * @return {Array} The objects to be added to the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "AddUnique", objects: Parse._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof Parse.Op.Unset) {
        return new Parse.Op.Set(this.objects());
      } else if (previous instanceof Parse.Op.Set) {
        return new Parse.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof Parse.Op.AddUnique) {
        return new Parse.Op.AddUnique(this._estimate(previous.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return _.clone(this.objects());
      } else {
        // We can't just take the _.uniq(_.union(...)) of oldValue and
        // this.objects, because the uniqueness may not apply to oldValue
        // (especially if the oldValue was set via .set())
        var newValue = _.clone(oldValue);
        Parse._arrayEach(this.objects(), function(obj) {
          if (obj instanceof Parse.Object && obj.id) {
            var matchingObj = _.find(newValue, function(anObj) {
              return (anObj instanceof Parse.Object) && (anObj.id === obj.id);
            });
            if (!matchingObj) {
              newValue.push(obj);
            } else {
              var index = _.indexOf(newValue, matchingObj);
              newValue[index] = obj;
            }
          } else if (!_.contains(newValue, obj)) {
            newValue.push(obj);
          }
        });
        return newValue;
      }
    }
  });

  Parse.Op._registerDecoder("AddUnique", function(json) {
    return new Parse.Op.AddUnique(Parse._decode(undefined, json.objects));
  });

  /**
   * @class
   * Remove is an atomic operation where the given objects will be removed from
   * the array that is stored in this field.
   */
  Parse.Op.Remove = Parse.Op._extend(/** @lends Parse.Op.Remove.prototype */ {
    _initialize: function(objects) {
      this._objects = _.uniq(objects);
    },

    /**
     * Returns the objects to be removed from the array.
     * @return {Array} The objects to be removed from the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Remove", objects: Parse._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof Parse.Op.Unset) {
        return previous;
      } else if (previous instanceof Parse.Op.Set) {
        return new Parse.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof Parse.Op.Remove) {
        return new Parse.Op.Remove(_.union(previous.objects(), this.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return [];
      } else {
        var newValue = _.difference(oldValue, this.objects());
        // If there are saved Parse Objects being removed, also remove them.
        Parse._arrayEach(this.objects(), function(obj) {
          if (obj instanceof Parse.Object && obj.id) {
            newValue = _.reject(newValue, function(other) {
              return (other instanceof Parse.Object) && (other.id === obj.id);
            });
          }
        });
        return newValue;
      }
    }
  });

  Parse.Op._registerDecoder("Remove", function(json) {
    return new Parse.Op.Remove(Parse._decode(undefined, json.objects));
  });

  /**
   * @class
   * A Relation operation indicates that the field is an instance of
   * Parse.Relation, and objects are being added to, or removed from, that
   * relation.
   */
  Parse.Op.Relation = Parse.Op._extend(
      /** @lends Parse.Op.Relation.prototype */ {

    _initialize: function(adds, removes) {
      this._targetClassName = null;

      var self = this;

      var pointerToId = function(object) {
        if (object instanceof Parse.Object) {
          if (!object.id) {
            throw "You can't add an unsaved Parse.Object to a relation.";
          }
          if (!self._targetClassName) {
            self._targetClassName = object.className;
          }
          if (self._targetClassName !== object.className) {
            throw "Tried to create a Parse.Relation with 2 different types: " +
                  self._targetClassName + " and " + object.className + ".";
          }
          return object.id;
        }
        return object;
      };

      this.relationsToAdd = _.uniq(_.map(adds, pointerToId));
      this.relationsToRemove = _.uniq(_.map(removes, pointerToId));
    },

    /**
     * Returns an array of unfetched Parse.Object that are being added to the
     * relation.
     * @return {Array}
     */
    added: function() {
      var self = this;
      return _.map(this.relationsToAdd, function(objectId) {
        var object = Parse.Object._create(self._targetClassName);
        object.id = objectId;
        return object;
      });
    },

    /**
     * Returns an array of unfetched Parse.Object that are being removed from
     * the relation.
     * @return {Array}
     */
    removed: function() {
      var self = this;
      return _.map(this.relationsToRemove, function(objectId) {
        var object = Parse.Object._create(self._targetClassName);
        object.id = objectId;
        return object;
      });
    },

    /**
     * Returns a JSON version of the operation suitable for sending to Parse.
     * @return {Object}
     */
    toJSON: function() {
      var adds = null;
      var removes = null;
      var self = this;
      var idToPointer = function(id) {
        return { __type: 'Pointer',
                 className: self._targetClassName,
                 objectId: id };
      };
      var pointers = null;
      if (this.relationsToAdd.length > 0) {
        pointers = _.map(this.relationsToAdd, idToPointer);
        adds = { "__op": "AddRelation", "objects": pointers };
      }

      if (this.relationsToRemove.length > 0) {
        pointers = _.map(this.relationsToRemove, idToPointer);
        removes = { "__op": "RemoveRelation", "objects": pointers };
      }

      if (adds && removes) {
        return { "__op": "Batch", "ops": [adds, removes]};
      }

      return adds || removes || {};
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof Parse.Op.Unset) {
        throw "You can't modify a relation after deleting it.";
      } else if (previous instanceof Parse.Op.Relation) {
        if (previous._targetClassName &&
            previous._targetClassName !== this._targetClassName) {
          throw "Related object must be of class " + previous._targetClassName +
              ", but " + this._targetClassName + " was passed in.";
        }
        var newAdd = _.union(_.difference(previous.relationsToAdd,
                                          this.relationsToRemove),
                             this.relationsToAdd);
        var newRemove = _.union(_.difference(previous.relationsToRemove,
                                             this.relationsToAdd),
                                this.relationsToRemove);

        var newRelation = new Parse.Op.Relation(newAdd, newRemove);
        newRelation._targetClassName = this._targetClassName;
        return newRelation;
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue, object, key) {
      if (!oldValue) {
        var relation = new Parse.Relation(object, key);
        relation.targetClassName = this._targetClassName;
      } else if (oldValue instanceof Parse.Relation) {
        if (this._targetClassName) {
          if (oldValue.targetClassName) {
            if (oldValue.targetClassName !== this._targetClassName) {
              throw "Related object must be a " + oldValue.targetClassName +
                  ", but a " + this._targetClassName + " was passed in.";
            }
          } else {
            oldValue.targetClassName = this._targetClassName;
          }
        }
        return oldValue;
      } else {
        throw "Op is invalid after previous op.";
      }
    }
  });

  Parse.Op._registerDecoder("AddRelation", function(json) {
    return new Parse.Op.Relation(Parse._decode(undefined, json.objects), []);
  });
  Parse.Op._registerDecoder("RemoveRelation", function(json) {
    return new Parse.Op.Relation([], Parse._decode(undefined, json.objects));
  });

}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creates a new Relation for the given parent object and key. This
   * constructor should rarely be used directly, but rather created by
   * Parse.Object.relation.
   * @param {Parse.Object} parent The parent of this relation.
   * @param {String} key The key for this relation on the parent.
   * @see Parse.Object#relation
   * @class
   *
   * <p>
   * A class that is used to access all of the children of a many-to-many
   * relationship.  Each instance of Parse.Relation is associated with a
   * particular parent object and key.
   * </p>
   */
  Parse.Relation = function(parent, key) {
    this.parent = parent;
    this.key = key;
    this.targetClassName = null;
  };

  Parse.Relation.prototype = {
    /**
     * Makes sure that this relation has the right parent and key.
     */
    _ensureParentAndKey: function(parent, key) {
      this.parent = this.parent || parent;
      this.key = this.key || key;
      if (this.parent !== parent) {
        throw "Internal Error. Relation retrieved from two different Objects.";
      }
      if (this.key !== key) {
        throw "Internal Error. Relation retrieved from two different keys.";
      }
    },

    /**
     * Adds a Parse.Object or an array of Parse.Objects to the relation.
     * @param {} objects The item or items to add.
     */
    add: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      var change = new Parse.Op.Relation(objects, []);
      this.parent.set(this.key, change);
      this.targetClassName = change._targetClassName;
    },

    /**
     * Removes a Parse.Object or an array of Parse.Objects from this relation.
     * @param {} objects The item or items to remove.
     */
    remove: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      var change = new Parse.Op.Relation([], objects);
      this.parent.set(this.key, change);
      this.targetClassName = change._targetClassName;
    },

    /**
     * Returns a JSON version of the object suitable for saving to disk.
     * @return {Object}
     */
    toJSON: function() {
      return { "__type": "Relation", "className": this.targetClassName };
    },

    /**
     * Returns a Parse.Query that is limited to objects in this
     * relation.
     * @return {Parse.Query}
     */
    query: function() {
      var targetClass;
      var query;
      if (!this.targetClassName) {
        targetClass = Parse.Object._getSubclass(this.parent.className);
        query = new Parse.Query(targetClass);
        query._extraOptions.redirectClassNameForKey = this.key;
      } else {
        targetClass = Parse.Object._getSubclass(this.targetClassName);
        query = new Parse.Query(targetClass);
      }
      query._addCondition("$relatedTo", "object", this.parent._toPointer());
      query._addCondition("$relatedTo", "key", this.key);

      return query;
    }
  };
}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * A Promise is returned by async methods as a hook to provide callbacks to be
   * called when the async task is fulfilled.
   *
   * <p>Typical usage would be like:<pre>
   *    query.find().then(function(results) {
   *      results[0].set("foo", "bar");
   *      return results[0].saveAsync();
   *    }).then(function(result) {
   *      console.log("Updated " + result.id);
   *    });
   * </pre></p>
   *
   * @see Parse.Promise.prototype.then
   * @class
   */
  Parse.Promise = function() {
    this._resolved = false;
    this._rejected = false;
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];
  };

  _.extend(Parse.Promise, /** @lends Parse.Promise */ {

    /**
     * Returns true iff the given object fulfils the Promise interface.
     * @return {Boolean}
     */
    is: function(promise) {
      return promise && promise.then && _.isFunction(promise.then);
    },

    /**
     * Returns a new promise that is resolved with a given value.
     * @return {Parse.Promise} the new promise.
     */
    as: function() {
      var promise = new Parse.Promise();
      promise.resolve.apply(promise, arguments);
      return promise;
    },

    /**
     * Returns a new promise that is rejected with a given error.
     * @return {Parse.Promise} the new promise.
     */
    error: function() {
      var promise = new Parse.Promise();
      promise.reject.apply(promise, arguments);
      return promise;
    },

    /**
     * Returns a new promise that is fulfilled when all of the input promises
     * are resolved. If any promise in the list fails, then the returned promise
     * will fail with the last error. If they all succeed, then the returned
     * promise will succeed, with the results being the results of all the input
     * promises. For example: <pre>
     *   var p1 = Parse.Promise.as(1);
     *   var p2 = Parse.Promise.as(2);
     *   var p3 = Parse.Promise.as(3);
     *
     *   Parse.Promise.when(p1, p2, p3).then(function(r1, r2, r3) {
     *     console.log(r1);  // prints 1
     *     console.log(r2);  // prints 2
     *     console.log(r3);  // prints 3
     *   });</pre>
     *
     * The input promises can also be specified as an array: <pre>
     *   var promises = [p1, p2, p3];
     *   Parse.Promise.when(promises).then(function(r1, r2, r3) {
     *     console.log(r1);  // prints 1
     *     console.log(r2);  // prints 2
     *     console.log(r3);  // prints 3
     *   });
     * </pre>
     * @param {Array} promises a list of promises to wait for.
     * @return {Parse.Promise} the new promise.
     */
    when: function(promises) {
      // Allow passing in Promises as separate arguments instead of an Array.
      var objects;
      if (promises && Parse._isNullOrUndefined(promises.length)) {
        objects = arguments;
      } else {
        objects = promises;
      }

      var total = objects.length;
      var hadError = false;
      var results = [];
      var errors = [];
      results.length = objects.length;
      errors.length = objects.length;

      if (total === 0) {
        return Parse.Promise.as.apply(this, results);
      }

      var promise = new Parse.Promise();

      var resolveOne = function() {
        total = total - 1;
        if (total === 0) {
          if (hadError) {
            promise.reject(errors);
          } else {
            promise.resolve.apply(promise, results);
          }
        }
      };

      Parse._arrayEach(objects, function(object, i) {
        if (Parse.Promise.is(object)) {
          object.then(function(result) {
            results[i] = result;
            resolveOne();
          }, function(error) {
            errors[i] = error;
            hadError = true;
            resolveOne();
          });
        } else {
          results[i] = object;
          resolveOne();
        }
      });

      return promise;
    },

    /**
     * Runs the given asyncFunction repeatedly, as long as the predicate
     * function returns a truthy value. Stops repeating if asyncFunction returns
     * a rejected promise.
     * @param {Function} predicate should return false when ready to stop.
     * @param {Function} asyncFunction should return a Promise.
     */
    _continueWhile: function(predicate, asyncFunction) {
      if (predicate()) {
        return asyncFunction().then(function() {
          return Parse.Promise._continueWhile(predicate, asyncFunction);
        });
      }
      return Parse.Promise.as();
    }
  });

  _.extend(Parse.Promise.prototype, /** @lends Parse.Promise.prototype */ {

    /**
     * Marks this promise as fulfilled, firing any callbacks waiting on it.
     * @param {Object} result the result to pass to the callbacks.
     */
    resolve: function(result) {
      if (this._resolved || this._rejected) {
        throw "A promise was resolved even though it had already been " +
          (this._resolved ? "resolved" : "rejected") + ".";
      }
      this._resolved = true;
      this._result = arguments;
      var results = arguments;
      Parse._arrayEach(this._resolvedCallbacks, function(resolvedCallback) {
        resolvedCallback.apply(this, results);
      });
      this._resolvedCallbacks = [];
      this._rejectedCallbacks = [];
    },

    /**
     * Marks this promise as fulfilled, firing any callbacks waiting on it.
     * @param {Object} error the error to pass to the callbacks.
     */
    reject: function(error) {
      if (this._resolved || this._rejected) {
        throw "A promise was rejected even though it had already been " +
          (this._resolved ? "resolved" : "rejected") + ".";
      }
      this._rejected = true;
      this._error = error;
      Parse._arrayEach(this._rejectedCallbacks, function(rejectedCallback) {
        rejectedCallback(error);
      });
      this._resolvedCallbacks = [];
      this._rejectedCallbacks = [];
    },

    /**
     * Adds callbacks to be called when this promise is fulfilled. Returns a new
     * Promise that will be fulfilled when the callback is complete. It allows
     * chaining. If the callback itself returns a Promise, then the one returned
     * by "then" will not be fulfilled until that one returned by the callback
     * is fulfilled.
     * @param {Function} resolvedCallback Function that is called when this
     * Promise is resolved. Once the callback is complete, then the Promise
     * returned by "then" will also be fulfilled.
     * @param {Function} rejectedCallback Function that is called when this
     * Promise is rejected with an error. Once the callback is complete, then
     * the promise returned by "then" with be resolved successfully. If
     * rejectedCallback is null, or it returns a rejected Promise, then the
     * Promise returned by "then" will be rejected with that error.
     * @return {Parse.Promise} A new Promise that will be fulfilled after this
     * Promise is fulfilled and either callback has completed. If the callback
     * returned a Promise, then this Promise will not be fulfilled until that
     * one is.
     */
    then: function(resolvedCallback, rejectedCallback) {
      var promise = new Parse.Promise();

      var wrappedResolvedCallback = function() {
        var result = arguments;
        if (resolvedCallback) {
          result = [resolvedCallback.apply(this, result)];
        }
        if (result.length === 1 && Parse.Promise.is(result[0])) {
          result[0].then(function() {
            promise.resolve.apply(promise, arguments);
          }, function(error) {
            promise.reject(error);
          });
        } else {
          promise.resolve.apply(promise, result);
        }
      };

      var wrappedRejectedCallback = function(error) {
        var result = [];
        if (rejectedCallback) {
          result = [rejectedCallback(error)];
          if (result.length === 1 && Parse.Promise.is(result[0])) {
            result[0].then(function() {
              promise.resolve.apply(promise, arguments);
            }, function(error) {
              promise.reject(error);
            });
          } else {
            // A Promises/A+ compliant implementation would call:
            // promise.resolve.apply(promise, result);
            promise.reject(result[0]);
          }
        } else {
          promise.reject(error);
        }
      };

      if (this._resolved) {
        wrappedResolvedCallback.apply(this, this._result);
      } else if (this._rejected) {
        wrappedRejectedCallback(this._error);
      } else {
        this._resolvedCallbacks.push(wrappedResolvedCallback);
        this._rejectedCallbacks.push(wrappedRejectedCallback);
      }

      return promise;
    },

    /**
     * Add handlers to be called when the promise 
     * is either resolved or rejected
     */
    always: function(callback) {
      return this.then(callback, callback);
    },

    /**
     * Add handlers to be called when the Promise object is resolved
     */
    done: function(callback) {
      return this.then(callback);
    },

    /**
     * Add handlers to be called when the Promise object is rejected
     */
    fail: function(callback) {
      return this.then(null, callback);
    },

    /**
     * Run the given callbacks after this promise is fulfilled.
     * @param optionsOrCallback {} A Backbone-style options callback, or a
     * callback function. If this is an options object and contains a "model"
     * attributes, that will be passed to error callbacks as the first argument.
     * @param model {} If truthy, this will be passed as the first result of
     * error callbacks. This is for Backbone-compatability.
     * @return {Parse.Promise} A promise that will be resolved after the
     * callbacks are run, with the same result as this.
     */
    _thenRunCallbacks: function(optionsOrCallback, model) {
      var options;
      if (_.isFunction(optionsOrCallback)) {
        var callback = optionsOrCallback;
        options = {
          success: function(result) {
            callback(result, null);
          },
          error: function(error) {
            callback(null, error);
          }
        };
      } else {
        options = _.clone(optionsOrCallback);
      }
      options = options || {};

      return this.then(function(result) {
        if (options.success) {
          options.success.apply(this, arguments);
        } else if (model) {
          // When there's no callback, a sync event should be triggered.
          model.trigger('sync', model, result, options);
        }
        return Parse.Promise.as.apply(Parse.Promise, arguments);
      }, function(error) {
        if (options.error) {
          if (!_.isUndefined(model)) {
            options.error(model, error);
          } else {
            options.error(error);
          }
        } else if (model) {
          // When there's no error callback, an error event should be triggered.
          model.trigger('error', model, error, options);
        }
        // By explicitly returning a rejected Promise, this will work with
        // either jQuery or Promises/A semantics.
        return Parse.Promise.error(error);
      });
    },

    /**
     * Adds a callback function that should be called regardless of whether
     * this promise failed or succeeded. The callback will be given either the
     * array of results for its first argument, or the error as its second,
     * depending on whether this Promise was rejected or resolved. Returns a
     * new Promise, like "then" would.
     * @param {Function} continuation the callback.
     */
    _continueWith: function(continuation) {
      return this.then(function() {
        return continuation(arguments, null);
      }, function(error) {
        return continuation(null, error);
      });
    }

  });

}(this));

/*jshint bitwise:false *//*global FileReader: true, File: true */
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  var b64Digit = function(number) {
    if (number < 26) {
      return String.fromCharCode(65 + number);
    }
    if (number < 52) {
      return String.fromCharCode(97 + (number - 26));
    }
    if (number < 62) {
      return String.fromCharCode(48 + (number - 52));
    }
    if (number === 62) {
      return "+";
    }
    if (number === 63) {
      return "/";
    }
    throw "Tried to encode large digit " + number + " in base64.";
  };

  var encodeBase64 = function(array) {
    var chunks = [];
    chunks.length = Math.ceil(array.length / 3);
    _.times(chunks.length, function(i) {
      var b1 = array[i * 3];
      var b2 = array[i * 3 + 1] || 0;
      var b3 = array[i * 3 + 2] || 0;

      var has2 = (i * 3 + 1) < array.length;
      var has3 = (i * 3 + 2) < array.length;

      chunks[i] = [
        b64Digit((b1 >> 2) & 0x3F),
        b64Digit(((b1 << 4) & 0x30) | ((b2 >> 4) & 0x0F)),
        has2 ? b64Digit(((b2 << 2) & 0x3C) | ((b3 >> 6) & 0x03)) : "=",
        has3 ? b64Digit(b3 & 0x3F) : "="
      ].join("");
    });
    return chunks.join("");
  };

  
  // A list of file extensions to mime types as found here:
  // http://stackoverflow.com/questions/58510/using-net-how-can-you-find-the-
  //     mime-type-of-a-file-based-on-the-file-signature
  var mimeTypes = {
    ai: "application/postscript",
    aif: "audio/x-aiff",
    aifc: "audio/x-aiff",
    aiff: "audio/x-aiff",
    asc: "text/plain",
    atom: "application/atom+xml",
    au: "audio/basic",
    avi: "video/x-msvideo",
    bcpio: "application/x-bcpio",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    cdf: "application/x-netcdf",
    cgm: "image/cgm",
    "class": "application/octet-stream",
    cpio: "application/x-cpio",
    cpt: "application/mac-compactpro",
    csh: "application/x-csh",
    css: "text/css",
    dcr: "application/x-director",
    dif: "video/x-dv",
    dir: "application/x-director",
    djv: "image/vnd.djvu",
    djvu: "image/vnd.djvu",
    dll: "application/octet-stream",
    dmg: "application/octet-stream",
    dms: "application/octet-stream",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml." +
          "document",
    dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml." +
          "template",
    docm: "application/vnd.ms-word.document.macroEnabled.12",
    dotm: "application/vnd.ms-word.template.macroEnabled.12",
    dtd: "application/xml-dtd",
    dv: "video/x-dv",
    dvi: "application/x-dvi",
    dxr: "application/x-director",
    eps: "application/postscript",
    etx: "text/x-setext",
    exe: "application/octet-stream",
    ez: "application/andrew-inset",
    gif: "image/gif",
    gram: "application/srgs",
    grxml: "application/srgs+xml",
    gtar: "application/x-gtar",
    hdf: "application/x-hdf",
    hqx: "application/mac-binhex40",
    htm: "text/html",
    html: "text/html",
    ice: "x-conference/x-cooltalk",
    ico: "image/x-icon",
    ics: "text/calendar",
    ief: "image/ief",
    ifb: "text/calendar",
    iges: "model/iges",
    igs: "model/iges",
    jnlp: "application/x-java-jnlp-file",
    jp2: "image/jp2",
    jpe: "image/jpeg",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "application/x-javascript",
    kar: "audio/midi",
    latex: "application/x-latex",
    lha: "application/octet-stream",
    lzh: "application/octet-stream",
    m3u: "audio/x-mpegurl",
    m4a: "audio/mp4a-latm",
    m4b: "audio/mp4a-latm",
    m4p: "audio/mp4a-latm",
    m4u: "video/vnd.mpegurl",
    m4v: "video/x-m4v",
    mac: "image/x-macpaint",
    man: "application/x-troff-man",
    mathml: "application/mathml+xml",
    me: "application/x-troff-me",
    mesh: "model/mesh",
    mid: "audio/midi",
    midi: "audio/midi",
    mif: "application/vnd.mif",
    mov: "video/quicktime",
    movie: "video/x-sgi-movie",
    mp2: "audio/mpeg",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpe: "video/mpeg",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    mpga: "audio/mpeg",
    ms: "application/x-troff-ms",
    msh: "model/mesh",
    mxu: "video/vnd.mpegurl",
    nc: "application/x-netcdf",
    oda: "application/oda",
    ogg: "application/ogg",
    pbm: "image/x-portable-bitmap",
    pct: "image/pict",
    pdb: "chemical/x-pdb",
    pdf: "application/pdf",
    pgm: "image/x-portable-graymap",
    pgn: "application/x-chess-pgn",
    pic: "image/pict",
    pict: "image/pict",
    png: "image/png", 
    pnm: "image/x-portable-anymap",
    pnt: "image/x-macpaint",
    pntg: "image/x-macpaint",
    ppm: "image/x-portable-pixmap",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml." +
          "presentation",
    potx: "application/vnd.openxmlformats-officedocument.presentationml." +
          "template",
    ppsx: "application/vnd.openxmlformats-officedocument.presentationml." +
          "slideshow",
    ppam: "application/vnd.ms-powerpoint.addin.macroEnabled.12",
    pptm: "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
    potm: "application/vnd.ms-powerpoint.template.macroEnabled.12",
    ppsm: "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
    ps: "application/postscript",
    qt: "video/quicktime",
    qti: "image/x-quicktime",
    qtif: "image/x-quicktime",
    ra: "audio/x-pn-realaudio",
    ram: "audio/x-pn-realaudio",
    ras: "image/x-cmu-raster",
    rdf: "application/rdf+xml",
    rgb: "image/x-rgb",
    rm: "application/vnd.rn-realmedia",
    roff: "application/x-troff",
    rtf: "text/rtf",
    rtx: "text/richtext",
    sgm: "text/sgml",
    sgml: "text/sgml",
    sh: "application/x-sh",
    shar: "application/x-shar",
    silo: "model/mesh",
    sit: "application/x-stuffit",
    skd: "application/x-koan",
    skm: "application/x-koan",
    skp: "application/x-koan",
    skt: "application/x-koan",
    smi: "application/smil",
    smil: "application/smil",
    snd: "audio/basic",
    so: "application/octet-stream",
    spl: "application/x-futuresplash",
    src: "application/x-wais-source",
    sv4cpio: "application/x-sv4cpio",
    sv4crc: "application/x-sv4crc",
    svg: "image/svg+xml",
    swf: "application/x-shockwave-flash",
    t: "application/x-troff",
    tar: "application/x-tar",
    tcl: "application/x-tcl",
    tex: "application/x-tex",
    texi: "application/x-texinfo",
    texinfo: "application/x-texinfo",
    tif: "image/tiff",
    tiff: "image/tiff",
    tr: "application/x-troff",
    tsv: "text/tab-separated-values",
    txt: "text/plain",
    ustar: "application/x-ustar",
    vcd: "application/x-cdlink",
    vrml: "model/vrml",
    vxml: "application/voicexml+xml",
    wav: "audio/x-wav",
    wbmp: "image/vnd.wap.wbmp",
    wbmxl: "application/vnd.wap.wbxml",
    wml: "text/vnd.wap.wml",
    wmlc: "application/vnd.wap.wmlc",
    wmls: "text/vnd.wap.wmlscript",
    wmlsc: "application/vnd.wap.wmlscriptc",
    wrl: "model/vrml",
    xbm: "image/x-xbitmap",
    xht: "application/xhtml+xml",
    xhtml: "application/xhtml+xml",
    xls: "application/vnd.ms-excel",
    xml: "application/xml",
    xpm: "image/x-xpixmap",
    xsl: "application/xml",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml." +
          "template",
    xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
    xltm: "application/vnd.ms-excel.template.macroEnabled.12",
    xlam: "application/vnd.ms-excel.addin.macroEnabled.12",
    xlsb: "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    xslt: "application/xslt+xml",
    xul: "application/vnd.mozilla.xul+xml",
    xwd: "image/x-xwindowdump",
    xyz: "chemical/x-xyz",
    zip: "application/zip"
  };

  /**
   * Reads a File using a FileReader.
   * @param file {File} the File to read.
   * @param type {String} (optional) the mimetype to override with.
   * @return {Parse.Promise} A Promise that will be fulfilled with a
   *     base64-encoded string of the data and its mime type.
   */
  var readAsync = function(file, type) {
    var promise = new Parse.Promise();

    if (typeof(FileReader) === "undefined") {
      return Parse.Promise.error(new Parse.Error(
          Parse.Error.FILE_READ_ERROR,
          "Attempted to use a FileReader on an unsupported browser."));
    }

    var reader = new FileReader();
    reader.onloadend = function() {
      if (reader.readyState !== 2) {
        promise.reject(new Parse.Error(
            Parse.Error.FILE_READ_ERROR,
            "Error reading file."));
        return;
      }

      var dataURL = reader.result;
      var matches = /^data:([^;]*);base64,(.*)$/.exec(dataURL);
      if (!matches) {
        promise.reject(new Parse.Error(
            Parse.ERROR.FILE_READ_ERROR,
            "Unable to interpret data URL: " + dataURL));
        return;
      }

      promise.resolve(matches[2], type || matches[1]);
    };
    reader.readAsDataURL(file);
    return promise;
  };

  /**
   * A Parse.File is a local representation of a file that is saved to the Parse
   * cloud.
   * @class
   * @param name {String} The file's name. This will be prefixed by a unique
   *     value once the file has finished saving. The file name must begin with
   *     an alphanumeric character, and consist of alphanumeric characters,
   *     periods, spaces, underscores, or dashes.
   * @param data {Array} The data for the file, as either:
   *     1. an Array of byte value Numbers, or
   *     2. an Object like { base64: "..." } with a base64-encoded String.
   *     3. a File object selected with a file upload control. (3) only works
   *        in Firefox 3.6+, Safari 6.0.2+, Chrome 7+, and IE 10+.
   *        For example:<pre>
   * var fileUploadControl = $("#profilePhotoFileUpload")[0];
   * if (fileUploadControl.files.length > 0) {
   *   var file = fileUploadControl.files[0];
   *   var name = "photo.jpg";
   *   var parseFile = new Parse.File(name, file);
   *   parseFile.save().then(function() {
   *     // The file has been saved to Parse.
   *   }, function(error) {
   *     // The file either could not be read, or could not be saved to Parse.
   *   });
   * }</pre>
   * @param type {String} Optional Content-Type header to use for the file. If
   *     this is omitted, the content type will be inferred from the name's
   *     extension.
   */
  Parse.File = function(name, data, type) {
    this._name = name;

    // Guess the content type from the extension if we need to.
    var extension = /\.([^.]*)$/.exec(name);
    if (extension) {
      extension = extension[1].toLowerCase();
    }
    var guessedType = type || mimeTypes[extension] || "text/plain";

    if (_.isArray(data)) {
      this._source = Parse.Promise.as(encodeBase64(data), guessedType);
    } else if (data && data.base64) {
      // if it contains data uri, extract based64 and the type out of it.
      /*jslint maxlen: 1000*/
      var dataUriRegexp = /^data:([a-zA-Z]*\/[a-zA-Z+.-]*);(charset=[a-zA-Z0-9\-\/\s]*,)?base64,(\S+)/;
      /*jslint maxlen: 80*/

      var matches = dataUriRegexp.exec(data.base64);
      if (matches && matches.length > 0) {
        // if data URI with charset, there will have 4 matches.
        this._source = Parse.Promise.as(
          (matches.length === 4 ? matches[3] : matches[2]), matches[1]
        );
      } else {
        this._source = Parse.Promise.as(data.base64, guessedType);
      }
    } else if (typeof(File) !== "undefined" && data instanceof File) {
      this._source = readAsync(data, type);
    } else if (_.isString(data)) {
      throw "Creating a Parse.File from a String is not yet supported.";
    }
  };

  Parse.File.prototype = {

    /**
     * Gets the name of the file. Before save is called, this is the filename
     * given by the user. After save is called, that name gets prefixed with a
     * unique identifier.
     */
    name: function() {
      return this._name;
    },

    /**
     * Gets the url of the file. It is only available after you save the file or
     * after you get the file from a Parse.Object.
     * @return {String}
     */
    url: function() {
      return this._url;
    },

    /**
     * Saves the file to the Parse cloud.
     * @param {Object} options A Backbone-style options object.
     * @return {Parse.Promise} Promise that is resolved when the save finishes.
     */
    save: function(options) {
      options= options || {};

      var self = this;
      if (!self._previousSave) {
        self._previousSave = self._source.then(function(base64, type) {
          var data = {
            base64: base64,
            _ContentType: type
          };
          return Parse._request({
            route: "files",
            className: self._name,
            method: 'POST',
            data: data,
            useMasterKey: options.useMasterKey
          });

        }).then(function(response) {
          self._name = response.name;
          self._url = response.url;
          return self;
        });
      }
      return self._previousSave._thenRunCallbacks(options);
    }
  };

}(this));

// Parse.Object is analogous to the Java ParseObject.
// It also implements the same interface as a Backbone model.

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creates a new model with defined attributes. A client id (cid) is
   * automatically generated and assigned for you.
   *
   * <p>You won't normally call this method directly.  It is recommended that
   * you use a subclass of <code>Parse.Object</code> instead, created by calling
   * <code>extend</code>.</p>
   *
   * <p>However, if you don't want to use a subclass, or aren't sure which
   * subclass is appropriate, you can use this form:<pre>
   *     var object = new Parse.Object("ClassName");
   * </pre>
   * That is basically equivalent to:<pre>
   *     var MyClass = Parse.Object.extend("ClassName");
   *     var object = new MyClass();
   * </pre></p>
   *
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @see Parse.Object.extend
   *
   * @class
   *
   * <p>The fundamental unit of Parse data, which implements the Backbone Model
   * interface.</p>
   */
  Parse.Object = function(attributes, options) {
    // Allow new Parse.Object("ClassName") as a shortcut to _create.
    if (_.isString(attributes)) {
      return Parse.Object._create.apply(this, arguments);
    }

    attributes = attributes || {};
    if (options && options.parse) {
      attributes = this.parse(attributes);
    }
    var defaults = Parse._getValue(this, 'defaults');
    if (defaults) {
      attributes = _.extend({}, defaults, attributes);
    }
    if (options && options.collection) {
      this.collection = options.collection;
    }

    this._serverData = {};  // The last known data for this object from cloud.
    this._opSetQueue = [{}];  // List of sets of changes to the data.
    this.attributes = {};  // The best estimate of this's current data.

    this._hashedJSON = {};  // Hash of values of containers at last save.
    this._escapedAttributes = {};
    this.cid = _.uniqueId('c');
    this.changed = {};
    this._silent = {};
    this._pending = {};
    if (!this.set(attributes, {silent: true})) {
      throw new Error("Can't create an invalid Parse.Object");
    }
    this.changed = {};
    this._silent = {};
    this._pending = {};
    this._hasData = true;
    this._previousAttributes = _.clone(this.attributes);
    this.initialize.apply(this, arguments);
  };

  /**
   * @lends Parse.Object.prototype
   * @property {String} id The objectId of the Parse Object.
   */

  /**
   * Saves the given list of Parse.Object.
   * If any error is encountered, stops and calls the error handler.
   *
   * <pre>
   *   Parse.Object.saveAll([object1, object2, ...], {
   *     success: function(list) {
   *       // All the objects were saved.
   *     },
   *     error: function(error) {
   *       // An error occurred while saving one of the objects.
   *     },
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>Parse.Object</code>.
   * @param {Object} options A Backbone-style callback object.
   * Valid options are:<ul>
   *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
   *     be used for this request.
   * </ul>
   */
  Parse.Object.saveAll = function(list, options) {
    options = options || {};
    return Parse.Object._deepSaveAsync(list, {
      useMasterKey: options.useMasterKey
    })._thenRunCallbacks(options);
  };

  /**
   * Destroy the given list of models on the server if it was already persisted.
   * Optimistically removes each model from its collection, if it has one.
   * If `wait: true` is passed, waits for the server to respond before removal.
   *
   * <p>Unlike saveAll, if an error occurs while deleting an individual model,
   * this method will continue trying to delete the rest of the models if
   * possible, except in the case of a fatal error like a connection error.
   *
   * <p>In particular, the Parse.Error object returned in the case of error may
   * be one of two types:
   *
   * <ul>
   *   <li>A Parse.Error.AGGREGATE_ERROR. This object's "errors" property is an
   *       array of other Parse.Error objects. Each error object in this array
   *       has an "object" property that references the object that could not be
   *       deleted (for instance, because that object could not be found).</li>
   *   <li>A non-aggregate Parse.Error. This indicates a serious error that 
   *       caused the delete operation to be aborted partway through (for 
   *       instance, a connection failure in the middle of the delete).</li>
   * </ul>
   *
   * <pre>
   *   Parse.Object.destroyAll([object1, object2, ...], {
   *     success: function() {
   *       // All the objects were deleted.
   *     },
   *     error: function(error) {
   *       // An error occurred while deleting one or more of the objects.
   *       // If this is an aggregate error, then we can inspect each error
   *       // object individually to determine the reason why a particular
   *       // object was not deleted.
   *       if (error.code == Parse.Error.AGGREGATE_ERROR) {
   *         for (var i = 0; i < error.errors.length; i++) {
   *           console.log("Couldn't delete " + error.errors[i].object.id + 
   *             "due to " + error.errors[i].message);
   *         }
   *       } else {
   *         console.log("Delete aborted because of " + error.message);
   *       }
   *     },
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>Parse.Object</code>.
   * @param {Object} options A Backbone-style callback object.
   * Valid options are:<ul>
   *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
   *     be used for this request.
   * </ul>
   */
  Parse.Object.destroyAll = function(list, options) {
    options = options || {};

    var triggerDestroy = function(object) {
      object.trigger('destroy', object, object.collection, options);
    };

    var errors = [];
    var destroyBatch = function(batch) {
      var promise = Parse.Promise.as();

      if (batch.length > 0) {
        promise = promise.then(function() {
          return Parse._request({
            route: "batch",
            method: "POST",
            useMasterKey: options.useMasterKey,
            data: {
              requests: _.map(batch, function(object) {
                return {
                  method: "DELETE",
                  path: "/1/classes/" + object.className + "/" + object.id
                };
              })
            }
          });
        }).then(function(responses, status, xhr) {
          Parse._arrayEach(batch, function(object, i) {
            if (responses[i].success && options.wait) {
              triggerDestroy(object);
            } else if (responses[i].error) {
              var error = new Parse.Error(responses[i].error.code,
                                          responses[i].error.error);
              error.object = object;

              errors.push(error);
            }
          });
        });
      }

      return promise;
    };

    var promise = Parse.Promise.as();
    var batch = [];
    Parse._arrayEach(list, function(object, i) {
      if (!object.id || !options.wait) {
        triggerDestroy(object);
      }

      if (object.id) {
        batch.push(object);
      }

      if (batch.length === 20 || i+1 === list.length) {
        var thisBatch = batch;
        batch = [];

        promise = promise.then(function() {
          return destroyBatch(thisBatch);
        });
      }
    });

    return promise.then(function() {
      if (errors.length === 0) {
        return true;
      } else {
        var error = new Parse.Error(Parse.Error.AGGREGATE_ERROR,
                                    "Error deleting an object in destroyAll");
        error.errors = errors;

        return Parse.Promise.error(error);
      }
    })._thenRunCallbacks(options);
  };

  /**
   * Fetches the given list of Parse.Object.
   * If any error is encountered, stops and calls the error handler.
   *
   * <pre>
   *   Parse.Object.fetchAll([object1, object2, ...], {
   *     success: function(list) {
   *       // All the objects were fetched.
   *     },
   *     error: function(error) {
   *       // An error occurred while fetching one of the objects.
   *     },
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>Parse.Object</code>.
   * @param {Object} options A Backbone-style callback object.
   * Valid options are:<ul>
   *   <li>success: A Backbone-style success callback.
   *   <li>error: An Backbone-style error callback.   
   * </ul>
   */
  Parse.Object.fetchAll = function(list, options) {
    return Parse.Object._fetchAll(
      list, 
      true
    )._thenRunCallbacks(options);    
  };  

  /**
   * Fetches the given list of Parse.Object if needed.
   * If any error is encountered, stops and calls the error handler.
   *
   * <pre>
   *   Parse.Object.fetchAllIfNeeded([object1, ...], {
   *     success: function(list) {
   *       // Objects were fetched and updated.
   *     },
   *     error: function(error) {
   *       // An error occurred while fetching one of the objects.
   *     },
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>Parse.Object</code>.
   * @param {Object} options A Backbone-style callback object.
   * Valid options are:<ul>
   *   <li>success: A Backbone-style success callback.
   *   <li>error: An Backbone-style error callback.   
   * </ul>
   */
  Parse.Object.fetchAllIfNeeded = function(list, options) {    
    return Parse.Object._fetchAll(
      list, 
      false
    )._thenRunCallbacks(options);
  };    

  // Attach all inheritable methods to the Parse.Object prototype.
  _.extend(Parse.Object.prototype, Parse.Events,
           /** @lends Parse.Object.prototype */ {
    _existed: false,

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    /**
     * Returns a JSON version of the object suitable for saving to Parse.
     * @return {Object}
     */
    toJSON: function() {
      var json = this._toFullJSON();
      Parse._arrayEach(["__type", "className"],
                       function(key) { delete json[key]; });
      return json;
    },

    _toFullJSON: function(seenObjects) {
      var json = _.clone(this.attributes);
      Parse._objectEach(json, function(val, key) {
        json[key] = Parse._encode(val, seenObjects);
      });
      Parse._objectEach(this._operations, function(val, key) {
        json[key] = val;
      });

      if (_.has(this, "id")) {
        json.objectId = this.id;
      }
      if (_.has(this, "createdAt")) {
        if (_.isDate(this.createdAt)) {
          json.createdAt = this.createdAt.toJSON();
        } else {
          json.createdAt = this.createdAt;
        }
      }

      if (_.has(this, "updatedAt")) {
        if (_.isDate(this.updatedAt)) {
          json.updatedAt = this.updatedAt.toJSON();
        } else {
          json.updatedAt = this.updatedAt;
        }
      }
      json.__type = "Object";
      json.className = this.className;
      return json;
    },

    /**
     * Updates _hashedJSON to reflect the current state of this object.
     * Adds any changed hash values to the set of pending changes.
     */
    _refreshCache: function() {
      var self = this;
      if (self._refreshingCache) {
        return;
      }
      self._refreshingCache = true;
      Parse._objectEach(this.attributes, function(value, key) {
        if (value instanceof Parse.Object) {
          value._refreshCache();
        } else if (_.isObject(value)) {
          if (self._resetCacheForKey(key)) {
            self.set(key, new Parse.Op.Set(value), { silent: true });
          }
        }
      });
      delete self._refreshingCache;
    },

    /**
     * Returns true if this object has been modified since its last
     * save/refresh.  If an attribute is specified, it returns true only if that
     * particular attribute has been modified since the last save/refresh.
     * @param {String} attr An attribute name (optional).
     * @return {Boolean}
     */
    dirty: function(attr) {
      this._refreshCache();

      var currentChanges = _.last(this._opSetQueue);

      if (attr) {
        return (currentChanges[attr] ? true : false);
      }
      if (!this.id) {
        return true;
      }
      if (_.keys(currentChanges).length > 0) {
        return true;
      }
      return false;
    },

    /**
     * Returns an array of keys that have been modified since last save/refresh
     * @return {Array of string}
     */
    dirtyKeys: function() {
      return _.keys(_.last(this._opSetQueue));
    },

    /**
     * Gets a Pointer referencing this Object.
     */
    _toPointer: function() {
      if (!this.id) {
        throw new Error("Can't serialize an unsaved Parse.Object");
      }
      return { __type: "Pointer",
               className: this.className,
               objectId: this.id };
    },

    /**
     * Gets the value of an attribute.
     * @param {String} attr The string name of an attribute.
     */
    get: function(attr) {
      return this.attributes[attr];
    },

    /**
     * Gets a relation on the given class for the attribute.
     * @param String attr The attribute to get the relation for.
     */
    relation: function(attr) {
      var value = this.get(attr);
      if (value) {
        if (!(value instanceof Parse.Relation)) {
          throw "Called relation() on non-relation field " + attr;
        }
        value._ensureParentAndKey(this, attr);
        return value;
      } else {
        return new Parse.Relation(this, attr);
      }
    },

    /**
     * Gets the HTML-escaped value of an attribute.
     */
    escape: function(attr) {
      var html = this._escapedAttributes[attr];
      if (html) {
        return html;
      }
      var val = this.attributes[attr];
      var escaped;
      if (Parse._isNullOrUndefined(val)) {
        escaped = '';
      } else {
        escaped = _.escape(val.toString());
      }
      this._escapedAttributes[attr] = escaped;
      return escaped;
    },

    /**
     * Returns <code>true</code> if the attribute contains a value that is not
     * null or undefined.
     * @param {String} attr The string name of the attribute.
     * @return {Boolean}
     */
    has: function(attr) {
      return !Parse._isNullOrUndefined(this.attributes[attr]);
    },

    /**
     * Pulls "special" fields like objectId, createdAt, etc. out of attrs
     * and puts them on "this" directly.  Removes them from attrs.
     * @param attrs - A dictionary with the data for this Parse.Object.
     */
    _mergeMagicFields: function(attrs) {
      // Check for changes of magic fields.
      var model = this;
      var specialFields = ["id", "objectId", "createdAt", "updatedAt"];
      Parse._arrayEach(specialFields, function(attr) {
        if (attrs[attr]) {
          if (attr === "objectId") {
            model.id = attrs[attr];
          } else if ((attr === "createdAt" || attr === "updatedAt") &&
                     !_.isDate(attrs[attr])) {
            model[attr] = Parse._parseDate(attrs[attr]);
          } else {
            model[attr] = attrs[attr];
          }
          delete attrs[attr];
        }
      });
    },

    /**
     * Copies the given serverData to "this", refreshes attributes, and
     * clears pending changes;
     */
    _copyServerData: function(serverData) {
      // Copy server data
      var tempServerData = {};
      Parse._objectEach(serverData, function(value, key) {
        tempServerData[key] = Parse._decode(key, value);
      });
      this._serverData = tempServerData;

      // Refresh the attributes.
      this._rebuildAllEstimatedData();

      
      // Clear out any changes the user might have made previously.
      this._refreshCache();
      this._opSetQueue = [{}];

      // Refresh the attributes again.
      this._rebuildAllEstimatedData();       
    },

    /**
     * Merges another object's attributes into this object.
     */
    _mergeFromObject: function(other) {
      if (!other) {
        return;
      }
      
      // This does the inverse of _mergeMagicFields.
      this.id = other.id;
      this.createdAt = other.createdAt;
      this.updatedAt = other.updatedAt;

      this._copyServerData(other._serverData);

      this._hasData = true;
    },

    /**
     * Returns the json to be sent to the server.
     */
    _startSave: function() {
      this._opSetQueue.push({});
    },

    /**
     * Called when a save fails because of an error. Any changes that were part
     * of the save need to be merged with changes made after the save. This
     * might throw an exception is you do conflicting operations. For example,
     * if you do:
     *   object.set("foo", "bar");
     *   object.set("invalid field name", "baz");
     *   object.save();
     *   object.increment("foo");
     * then this will throw when the save fails and the client tries to merge
     * "bar" with the +1.
     */
    _cancelSave: function() {
      var self = this;
      var failedChanges = _.first(this._opSetQueue);
      this._opSetQueue = _.rest(this._opSetQueue);
      var nextChanges = _.first(this._opSetQueue);
      Parse._objectEach(failedChanges, function(op, key) {
        var op1 = failedChanges[key];
        var op2 = nextChanges[key];
        if (op1 && op2) {
          nextChanges[key] = op2._mergeWithPrevious(op1);
        } else if (op1) {
          nextChanges[key] = op1;
        }
      });
      this._saving = this._saving - 1;
    },

    /**
     * Called when a save completes successfully. This merges the changes that
     * were saved into the known server data, and overrides it with any data
     * sent directly from the server.
     */
    _finishSave: function(serverData) {
      // Grab a copy of any object referenced by this object. These instances
      // may have already been fetched, and we don't want to lose their data.
      // Note that doing it like this means we will unify separate copies of the
      // same object, but that's a risk we have to take.
      var fetchedObjects = {};
      Parse._traverse(this.attributes, function(object) {
        if (object instanceof Parse.Object && object.id && object._hasData) {
          fetchedObjects[object.id] = object;
        }
      });

      var savedChanges = _.first(this._opSetQueue);
      this._opSetQueue = _.rest(this._opSetQueue);
      this._applyOpSet(savedChanges, this._serverData);
      this._mergeMagicFields(serverData);
      var self = this;
      Parse._objectEach(serverData, function(value, key) {
        self._serverData[key] = Parse._decode(key, value);

        // Look for any objects that might have become unfetched and fix them
        // by replacing their values with the previously observed values.
        var fetched = Parse._traverse(self._serverData[key], function(object) {
          if (object instanceof Parse.Object && fetchedObjects[object.id]) {
            return fetchedObjects[object.id];
          }
        });
        if (fetched) {
          self._serverData[key] = fetched;
        }
      });
      this._rebuildAllEstimatedData();
      this._saving = this._saving - 1;
    },

    /**
     * Called when a fetch or login is complete to set the known server data to
     * the given object.
     */
    _finishFetch: function(serverData, hasData) {
      
      this._opSetQueue = [{}];

      // Bring in all the new server data.
      this._mergeMagicFields(serverData);
      this._copyServerData(serverData);

      this._hasData = hasData;
    },

    /**
     * Applies the set of Parse.Op in opSet to the object target.
     */
    _applyOpSet: function(opSet, target) {
      var self = this;
      Parse._objectEach(opSet, function(change, key) {
        target[key] = change._estimate(target[key], self, key);
        if (target[key] === Parse.Op._UNSET) {
          delete target[key];
        }
      });
    },

    /**
     * Replaces the cached value for key with the current value.
     * Returns true if the new value is different than the old value.
     */
    _resetCacheForKey: function(key) {
      var value = this.attributes[key];
      if (_.isObject(value) &&
          !(value instanceof Parse.Object) &&
          !(value instanceof Parse.File)) {
        value = value.toJSON ? value.toJSON() : value;
        var json = JSON.stringify(value);
        if (this._hashedJSON[key] !== json) {
          this._hashedJSON[key] = json;
          return true;
        }
      }
      return false;
    },

    /**
     * Populates attributes[key] by starting with the last known data from the
     * server, and applying all of the local changes that have been made to that
     * key since then.
     */
    _rebuildEstimatedDataForKey: function(key) {
      var self = this;
      delete this.attributes[key];
      if (this._serverData[key]) {
        this.attributes[key] = this._serverData[key];
      }
      Parse._arrayEach(this._opSetQueue, function(opSet) {
        var op = opSet[key];
        if (op) {
          self.attributes[key] = op._estimate(self.attributes[key], self, key);
          if (self.attributes[key] === Parse.Op._UNSET) {
            delete self.attributes[key];
          } else {
            self._resetCacheForKey(key);
          }
        }
      });
    },

    /**
     * Populates attributes by starting with the last known data from the
     * server, and applying all of the local changes that have been made since
     * then.
     */
    _rebuildAllEstimatedData: function() {
      var self = this;

      var previousAttributes = _.clone(this.attributes);

      this.attributes = _.clone(this._serverData);
      Parse._arrayEach(this._opSetQueue, function(opSet) {
        self._applyOpSet(opSet, self.attributes);
        Parse._objectEach(opSet, function(op, key) {
          self._resetCacheForKey(key);
        });
      });

      // Trigger change events for anything that changed because of the fetch.
      Parse._objectEach(previousAttributes, function(oldValue, key) {
        if (self.attributes[key] !== oldValue) {
          self.trigger('change:' + key, self, self.attributes[key], {});
        }
      });
      Parse._objectEach(this.attributes, function(newValue, key) {
        if (!_.has(previousAttributes, key)) {
          self.trigger('change:' + key, self, newValue, {});
        }
      });
    },

    /**
     * Sets a hash of model attributes on the object, firing
     * <code>"change"</code> unless you choose to silence it.
     *
     * <p>You can call it with an object containing keys and values, or with one
     * key and value.  For example:<pre>
     *   gameTurn.set({
     *     player: player1,
     *     diceRoll: 2
     *   }, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
     *
     *   game.set("currentPlayer", player2, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
     *
     *   game.set("finished", true);</pre></p>
     * 
     * @param {String} key The key to set.
     * @param {} value The value to give it.
     * @param {Object} options A set of Backbone-like options for the set.
     *     The only supported options are <code>silent</code>,
     *     <code>error</code>, and <code>promise</code>.
     * @return {Boolean} true if the set succeeded.
     * @see Parse.Object#validate
     * @see Parse.Error
     */
    set: function(key, value, options) {
      var attrs, attr;
      if (_.isObject(key) || Parse._isNullOrUndefined(key)) {
        attrs = key;
        Parse._objectEach(attrs, function(v, k) {
          attrs[k] = Parse._decode(k, v);
        });
        options = value;
      } else {
        attrs = {};
        attrs[key] = Parse._decode(key, value);
      }

      // Extract attributes and options.
      options = options || {};
      if (!attrs) {
        return this;
      }
      if (attrs instanceof Parse.Object) {
        attrs = attrs.attributes;
      }

      // If the unset option is used, every attribute should be a Unset.
      if (options.unset) {
        Parse._objectEach(attrs, function(unused_value, key) {
          attrs[key] = new Parse.Op.Unset();
        });
      }

      // Apply all the attributes to get the estimated values.
      var dataToValidate = _.clone(attrs);
      var self = this;
      Parse._objectEach(dataToValidate, function(value, key) {
        if (value instanceof Parse.Op) {
          dataToValidate[key] = value._estimate(self.attributes[key],
                                                self, key);
          if (dataToValidate[key] === Parse.Op._UNSET) {
            delete dataToValidate[key];
          }
        }
      });

      // Run validation.
      if (!this._validate(attrs, options)) {
        return false;
      }

      this._mergeMagicFields(attrs);

      options.changes = {};
      var escaped = this._escapedAttributes;
      var prev = this._previousAttributes || {};

      // Update attributes.
      Parse._arrayEach(_.keys(attrs), function(attr) {
        var val = attrs[attr];

        // If this is a relation object we need to set the parent correctly,
        // since the location where it was parsed does not have access to
        // this object.
        if (val instanceof Parse.Relation) {
          val.parent = self;
        }

        if (!(val instanceof Parse.Op)) {
          val = new Parse.Op.Set(val);
        }

        // See if this change will actually have any effect.
        var isRealChange = true;
        if (val instanceof Parse.Op.Set &&
            _.isEqual(self.attributes[attr], val.value)) {
          isRealChange = false;
        }

        if (isRealChange) {
          delete escaped[attr];
          if (options.silent) {
            self._silent[attr] = true;
          } else {
            options.changes[attr] = true;
          }
        }

        var currentChanges = _.last(self._opSetQueue);
        currentChanges[attr] = val._mergeWithPrevious(currentChanges[attr]);
        self._rebuildEstimatedDataForKey(attr);

        if (isRealChange) {
          self.changed[attr] = self.attributes[attr];
          if (!options.silent) {
            self._pending[attr] = true;
          }
        } else {
          delete self.changed[attr];
          delete self._pending[attr];
        }
      });

      if (!options.silent) {
        this.change(options);
      }
      return this;
    },

    /**
     * Remove an attribute from the model, firing <code>"change"</code> unless
     * you choose to silence it. This is a noop if the attribute doesn't
     * exist.
     */
    unset: function(attr, options) {
      options = options || {};
      options.unset = true;
      return this.set(attr, null, options);
    },

    /**
     * Atomically increments the value of the given attribute the next time the
     * object is saved. If no amount is specified, 1 is used by default.
     *
     * @param attr {String} The key.
     * @param amount {Number} The amount to increment by.
     */
    increment: function(attr, amount) {
      if (_.isUndefined(amount) || _.isNull(amount)) {
        amount = 1;
      }
      return this.set(attr, new Parse.Op.Increment(amount));
    },

    /**
     * Atomically add an object to the end of the array associated with a given
     * key.
     * @param attr {String} The key.
     * @param item {} The item to add.
     */
    add: function(attr, item) {
      return this.set(attr, new Parse.Op.Add([item]));
    },

    /**
     * Atomically add an object to the array associated with a given key, only
     * if it is not already present in the array. The position of the insert is
     * not guaranteed.
     *
     * @param attr {String} The key.
     * @param item {} The object to add.
     */
    addUnique: function(attr, item) {
      return this.set(attr, new Parse.Op.AddUnique([item]));
    },

    /**
     * Atomically remove all instances of an object from the array associated
     * with a given key.
     *
     * @param attr {String} The key.
     * @param item {} The object to remove.
     */
    remove: function(attr, item) {
      return this.set(attr, new Parse.Op.Remove([item]));
    },

    /**
     * Returns an instance of a subclass of Parse.Op describing what kind of
     * modification has been performed on this field since the last time it was
     * saved. For example, after calling object.increment("x"), calling
     * object.op("x") would return an instance of Parse.Op.Increment.
     *
     * @param attr {String} The key.
     * @returns {Parse.Op} The operation, or undefined if none.
     */
    op: function(attr) {
      return _.last(this._opSetQueue)[attr];
    },

    /**
     * Clear all attributes on the model, firing <code>"change"</code> unless
     * you choose to silence it.
     */
    clear: function(options) {
      options = options || {};
      options.unset = true;
      var keysToClear = _.extend(this.attributes, this._operations);
      return this.set(keysToClear, options);
    },

    /**
     * Returns a JSON-encoded set of operations to be sent with the next save
     * request.
     */
    _getSaveJSON: function() {
      var json = _.clone(_.first(this._opSetQueue));
      Parse._objectEach(json, function(op, key) {
        json[key] = op.toJSON();
      });
      return json;
    },

    /**
     * Returns true if this object can be serialized for saving.
     */
    _canBeSerialized: function() {
      return Parse.Object._canBeSerializedAsValue(this.attributes);
    },

    /**
     * Fetch the model from the server. If the server's representation of the
     * model differs from its current attributes, they will be overriden,
     * triggering a <code>"change"</code> event.
     *
     * @param {Object} options A Backbone-style callback object.
     * Valid options are:<ul>
     *   <li>success: A Backbone-style success callback.
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     * @return {Parse.Promise} A promise that is fulfilled when the fetch
     *     completes.
     */
    fetch: function(options) {
      var self = this;
      options = options || {};
      var request = Parse._request({
        method: 'GET',
        route: "classes",
        className: this.className,
        objectId: this.id,
        useMasterKey: options.useMasterKey
      });
      return request.then(function(response, status, xhr) {
        self._finishFetch(self.parse(response, status, xhr), true);
        return self;
      })._thenRunCallbacks(options, this);
    },

    /**
     * Set a hash of model attributes, and save the model to the server.
     * updatedAt will be updated when the request returns.
     * You can either call it as:<pre>
     *   object.save();</pre>
     * or<pre>
     *   object.save(null, options);</pre>
     * or<pre>
     *   object.save(attrs, options);</pre>
     * or<pre>
     *   object.save(key, value, options);</pre>
     *
     * For example, <pre>
     *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }, {
     *     success: function(gameTurnAgain) {
     *       // The save was successful.
     *     },
     *     error: function(gameTurnAgain, error) {
     *       // The save failed.  Error is an instance of Parse.Error.
     *     }
     *   });</pre>
     * or with promises:<pre>
     *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }).then(function(gameTurnAgain) {
     *     // The save was successful.
     *   }, function(error) {
     *     // The save failed.  Error is an instance of Parse.Error.
     *   });</pre>
     * 
     * @param {Object} options A Backbone-style callback object.
     * Valid options are:<ul>
     *   <li>wait: Set to true to wait for the server to confirm a successful
     *   save before modifying the attributes on the object.
     *   <li>silent: Set to true to avoid firing the `set` event.
     *   <li>success: A Backbone-style success callback.
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     * @return {Parse.Promise} A promise that is fulfilled when the save
     *     completes.
     * @see Parse.Error
     */
    save: function(arg1, arg2, arg3) {
      var i, attrs, current, options, saved;
      if (_.isObject(arg1) || Parse._isNullOrUndefined(arg1)) {
        attrs = arg1;
        options = arg2;
      } else {
        attrs = {};
        attrs[arg1] = arg2;
        options = arg3;
      }

      // Make save({ success: function() {} }) work.
      if (!options && attrs) {
        var extra_keys = _.reject(attrs, function(value, key) {
          return _.include(["success", "error", "wait"], key);
        });
        if (extra_keys.length === 0) {
          var all_functions = true;
          if (_.has(attrs, "success") && !_.isFunction(attrs.success)) {
            all_functions = false;
          }
          if (_.has(attrs, "error") && !_.isFunction(attrs.error)) {
            all_functions = false;
          }
          if (all_functions) {
            // This attrs object looks like it's really an options object,
            // and there's no other options object, so let's just use it.
            return this.save(null, attrs);
          }
        }
      }

      options = _.clone(options) || {};
      if (options.wait) {
        current = _.clone(this.attributes);
      }

      var setOptions = _.clone(options) || {};
      if (setOptions.wait) {
        setOptions.silent = true;
      }
      var setError;
      setOptions.error = function(model, error) {
        setError = error;
      };
      if (attrs && !this.set(attrs, setOptions)) {
        return Parse.Promise.error(setError)._thenRunCallbacks(options, this);
      }

      var model = this;

      // If there is any unsaved child, save it first.
      model._refreshCache();

      

      var unsavedChildren = [];
      var unsavedFiles = [];
      Parse.Object._findUnsavedChildren(model.attributes,
                                        unsavedChildren,
                                        unsavedFiles);
      if (unsavedChildren.length + unsavedFiles.length > 0) {
        return Parse.Object._deepSaveAsync(this.attributes, {
          useMasterKey: options.useMasterKey
        }).then(function() {
          return model.save(null, options);
        }, function(error) {
          return Parse.Promise.error(error)._thenRunCallbacks(options, model);
        });
      }

      this._startSave();
      this._saving = (this._saving || 0) + 1;

      this._allPreviousSaves = this._allPreviousSaves || Parse.Promise.as();
      this._allPreviousSaves = this._allPreviousSaves._continueWith(function() {
        var method = model.id ? 'PUT' : 'POST';

        var json = model._getSaveJSON();

        var route = "classes";
        var className = model.className;
        if (model.className === "_User" && !model.id) {
          // Special-case user sign-up.
          route = "users";
          className = null;
        }
        var request = Parse._request({
          route: route,
          className: className,
          objectId: model.id,
          method: method,
          useMasterKey: options.useMasterKey,
          data: json
        });

        request = request.then(function(resp, status, xhr) {
          var serverAttrs = model.parse(resp, status, xhr);
          if (options.wait) {
            serverAttrs = _.extend(attrs || {}, serverAttrs);
          }
          model._finishSave(serverAttrs);
          if (options.wait) {
            model.set(current, setOptions);
          }
          return model;

        }, function(error) {
          model._cancelSave();
          return Parse.Promise.error(error);

        })._thenRunCallbacks(options, model);

        return request;
      });
      return this._allPreviousSaves;
    },

    /**
     * Destroy this model on the server if it was already persisted.
     * Optimistically removes the model from its collection, if it has one.
     * If `wait: true` is passed, waits for the server to respond
     * before removal.
     *
     * @param {Object} options A Backbone-style callback object.
     * Valid options are:<ul>
     *   <li>wait: Set to true to wait for the server to confirm successful
     *   deletion of the object before triggering the `destroy` event.
     *   <li>success: A Backbone-style success callback
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     * @return {Parse.Promise} A promise that is fulfilled when the destroy
     *     completes.
     */
    destroy: function(options) {
      options = options || {};
      var model = this;

      var triggerDestroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      if (!this.id) {
        return triggerDestroy();
      }

      if (!options.wait) {
        triggerDestroy();
      }

      var request = Parse._request({
        route: "classes",
        className: this.className,
        objectId: this.id,
        method: 'DELETE',
        useMasterKey: options.useMasterKey
      });
      return request.then(function() {
        if (options.wait) {
          triggerDestroy();
        }
        return model;
      })._thenRunCallbacks(options, this);
    },

    /**
     * Converts a response into the hash of attributes to be set on the model.
     * @ignore
     */
    parse: function(resp, status, xhr) {
      var output = _.clone(resp);
      _(["createdAt", "updatedAt"]).each(function(key) {
        if (output[key]) {
          output[key] = Parse._parseDate(output[key]);
        }
      });
      if (!output.updatedAt) {
        output.updatedAt = output.createdAt;
      }
      if (status) {
        this._existed = (status !== 201);
      }
      return output;
    },

    /**
     * Creates a new model with identical attributes to this one.
     * @return {Parse.Object}
     */
    clone: function() {
      return new this.constructor(this.attributes);
    },

    /**
     * Returns true if this object has never been saved to Parse.
     * @return {Boolean}
     */
    isNew: function() {
      return !this.id;
    },

    /**
     * Call this method to manually fire a `"change"` event for this model and
     * a `"change:attribute"` event for each changed attribute.
     * Calling this will cause all objects observing the model to update.
     */
    change: function(options) {
      options = options || {};
      var changing = this._changing;
      this._changing = true;

      // Silent changes become pending changes.
      var self = this;
      Parse._objectEach(this._silent, function(attr) {
        self._pending[attr] = true;
      });

      // Silent changes are triggered.
      var changes = _.extend({}, options.changes, this._silent);
      this._silent = {};
      Parse._objectEach(changes, function(unused_value, attr) {
        self.trigger('change:' + attr, self, self.get(attr), options);
      });
      if (changing) {
        return this;
      }

      // This is to get around lint not letting us make a function in a loop.
      var deleteChanged = function(value, attr) {
        if (!self._pending[attr] && !self._silent[attr]) {
          delete self.changed[attr];
        }
      };

      // Continue firing `"change"` events while there are pending changes.
      while (!_.isEmpty(this._pending)) {
        this._pending = {};
        this.trigger('change', this, options);
        // Pending and silent changes still remain.
        Parse._objectEach(this.changed, deleteChanged);
        self._previousAttributes = _.clone(this.attributes);
      }

      this._changing = false;
      return this;
    },

    /**
     * Returns true if this object was created by the Parse server when the
     * object might have already been there (e.g. in the case of a Facebook
     * login)
     */
    existed: function() {
      return this._existed;
    },

    /**
     * Determine if the model has changed since the last <code>"change"</code>
     * event.  If you specify an attribute name, determine if that attribute
     * has changed.
     * @param {String} attr Optional attribute name
     * @return {Boolean}
     */
    hasChanged: function(attr) {
      if (!arguments.length) {
        return !_.isEmpty(this.changed);
      }
      return this.changed && _.has(this.changed, attr);
    },

    /**
     * Returns an object containing all the attributes that have changed, or
     * false if there are no changed attributes. Useful for determining what
     * parts of a view need to be updated and/or what attributes need to be
     * persisted to the server. Unset attributes will be set to undefined.
     * You can also pass an attributes object to diff against the model,
     * determining if there *would be* a change.
     */
    changedAttributes: function(diff) {
      if (!diff) {
        return this.hasChanged() ? _.clone(this.changed) : false;
      }
      var changed = {};
      var old = this._previousAttributes;
      Parse._objectEach(diff, function(diffVal, attr) {
        if (!_.isEqual(old[attr], diffVal)) {
          changed[attr] = diffVal;
        }
      });
      return changed;
    },

    /**
     * Gets the previous value of an attribute, recorded at the time the last
     * <code>"change"</code> event was fired.
     * @param {String} attr Name of the attribute to get.
     */
    previous: function(attr) {
      if (!arguments.length || !this._previousAttributes) {
        return null;
      }
      return this._previousAttributes[attr];
    },

    /**
     * Gets all of the attributes of the model at the time of the previous
     * <code>"change"</code> event.
     * @return {Object}
     */
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    /**
     * Checks if the model is currently in a valid state. It's only possible to
     * get into an *invalid* state if you're using silent changes.
     * @return {Boolean}
     */
    isValid: function() {
      return !this.validate(this.attributes);
    },

    /**
     * You should not call this function directly unless you subclass
     * <code>Parse.Object</code>, in which case you can override this method
     * to provide additional validation on <code>set</code> and
     * <code>save</code>.  Your implementation should return 
     *
     * @param {Object} attrs The current data to validate.
     * @param {Object} options A Backbone-like options object.
     * @return {} False if the data is valid.  An error object otherwise.
     * @see Parse.Object#set
     */
    validate: function(attrs, options) {
      if (_.has(attrs, "ACL") && !(attrs.ACL instanceof Parse.ACL)) {
        return new Parse.Error(Parse.Error.OTHER_CAUSE,
                               "ACL must be a Parse.ACL.");
      }
      var correct = true;
      Parse._objectEach(attrs, function(unused_value, key) {
        if (!(/^[A-Za-z][0-9A-Za-z_]*$/).test(key)) {
          correct = false;
        }
      });
      if (!correct) {
        return new Parse.Error(Parse.Error.INVALID_KEY_NAME); 
      }
      return false;
    },

    /**
     * Run validation against a set of incoming attributes, returning `true`
     * if all is well. If a specific `error` callback has been passed,
     * call that instead of firing the general `"error"` event.
     */
    _validate: function(attrs, options) {
      if (options.silent || !this.validate) {
        return true;
      }
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validate(attrs, options);
      if (!error) {
        return true;
      }
      if (options && options.error) {
        options.error(this, error, options);
      } else {
        this.trigger('error', this, error, options);
      }
      return false;
    },

    /**
     * Returns the ACL for this object.
     * @returns {Parse.ACL} An instance of Parse.ACL.
     * @see Parse.Object#get
     */
    getACL: function() {
      return this.get("ACL");
    },

    /**
     * Sets the ACL to be used for this object.
     * @param {Parse.ACL} acl An instance of Parse.ACL.
     * @param {Object} options Optional Backbone-like options object to be
     *     passed in to set.
     * @return {Boolean} Whether the set passed validation.
     * @see Parse.Object#set
     */
    setACL: function(acl, options) {
      return this.set("ACL", acl, options);
    }

  });

  /**
   * Returns the appropriate subclass for making new instances of the given
   * className string.
   */
  Parse.Object._getSubclass = function(className) {
    if (!_.isString(className)) {
      throw "Parse.Object._getSubclass requires a string argument.";
    }
    var ObjectClass = Parse.Object._classMap[className];
    if (!ObjectClass) {
      ObjectClass = Parse.Object.extend(className);
      Parse.Object._classMap[className] = ObjectClass;
    }
    return ObjectClass;
  };

  /**
   * Creates an instance of a subclass of Parse.Object for the given classname.
   */
  Parse.Object._create = function(className, attributes, options) {
    var ObjectClass = Parse.Object._getSubclass(className);
    return new ObjectClass(attributes, options);
  };
  
  /**
   * Returns a list of object ids given a list of objects.
   */
  Parse.Object._toObjectIdArray = function(list, omitObjectsWithData) {
    if (list.length === 0) {
      return Parse.Promise.as(list);
    }

    var error;
    var className = list[0].className;
    var objectIds = [];   
    for (var i = 0; i < list.length; i++) {
      var object = list[i];
      if (className !== object.className) {
        error = new Parse.Error(Parse.Error.INVALID_CLASS_NAME, 
                                "All objects should be of the same class");
        return Parse.Promise.error(error);
      } else if (!object.id) {
        error = new Parse.Error(Parse.Error.MISSING_OBJECT_ID,
                                "All objects must have an ID");
        return Parse.Promise.error(error);
      } else if (omitObjectsWithData && object._hasData) {
        continue;
      }
      objectIds.push(object.id);
    }

    return Parse.Promise.as(objectIds);
  };

  /**
   * Updates a list of objects with fetched results.
   */
  Parse.Object._updateWithFetchedResults = function(list, fetched, forceFetch) {
    var fetchedObjectsById = {};
    Parse._arrayEach(fetched, function(object, i) {
      fetchedObjectsById[object.id] = object;
    });

    for (var i = 0; i < list.length; i++) {
      var object = list[i];  
      var fetchedObject = fetchedObjectsById[object.id];
      if (!fetchedObject && forceFetch) {
        var error = new Parse.Error(Parse.Error.OBJECT_NOT_FOUND,
                                "All objects must exist on the server");
        return Parse.Promise.error(error);        
      }   

      object._mergeFromObject(fetchedObject);
    }

    return Parse.Promise.as(list);
  };  
  
  /**
   * Fetches the objects given in list.  The forceFetch option will fetch all
   * objects if true and ignore objects with data if false.
   */
  Parse.Object._fetchAll = function(list, forceFetch) {    
    if (list.length === 0) {
      return Parse.Promise.as(list);
    } 
    
    var omitObjectsWithData = !forceFetch;
    return Parse.Object._toObjectIdArray(
      list, 
      omitObjectsWithData
    ).then(function(objectIds) {
      var className = list[0].className;
      var query = new Parse.Query(className);
      query.containedIn("objectId", objectIds);
      query.limit = objectIds.length;
      return query.find();
    }).then(function(results) {
      return Parse.Object._updateWithFetchedResults(
        list, 
        results, 
        forceFetch
      );
    });   
  };  

  // Set up a map of className to class so that we can create new instances of
  // Parse Objects from JSON automatically.
  Parse.Object._classMap = {};

  Parse.Object._extend = Parse._extend;

  /**
   * Creates a new subclass of Parse.Object for the given Parse class name.
   *
   * <p>Every extension of a Parse class will inherit from the most recent
   * previous extension of that class. When a Parse.Object is automatically
   * created by parsing JSON, it will use the most recent extension of that
   * class.</p>
   *
   * <p>You should call either:<pre>
   *     var MyClass = Parse.Object.extend("MyClass", {
   *         <i>Instance methods</i>,
   *         initialize: function(attrs, options) {
   *             this.someInstanceProperty = [],
   *             <i>Other instance properties</i>
   *         }
   *     }, {
   *         <i>Class properties</i>
   *     });</pre>
   * or, for Backbone compatibility:<pre>
   *     var MyClass = Parse.Object.extend({
   *         className: "MyClass",
   *         <i>Instance methods</i>,
   *         initialize: function(attrs, options) {
   *             this.someInstanceProperty = [],
   *             <i>Other instance properties</i>
   *         }
   *     }, {
   *         <i>Class properties</i>
   *     });</pre></p>
   *
   * @param {String} className The name of the Parse class backing this model.
   * @param {Object} protoProps Instance properties to add to instances of the
   *     class returned from this method.
   * @param {Object} classProps Class properties to add the class returned from
   *     this method.
   * @return {Class} A new subclass of Parse.Object.
   */
  Parse.Object.extend = function(className, protoProps, classProps) {
    // Handle the case with only two args.
    if (!_.isString(className)) {
      if (className && _.has(className, "className")) {
        return Parse.Object.extend(className.className, className, protoProps);
      } else {
        throw new Error(
            "Parse.Object.extend's first argument should be the className.");
      }
    }

    // If someone tries to subclass "User", coerce it to the right type.
    if (className === "User" && Parse.User._performUserRewrite) {
      className = "_User";
    }
    protoProps = protoProps || {};
    protoProps.className = className;

    var NewClassObject = null;
    if (_.has(Parse.Object._classMap, className)) {
      var OldClassObject = Parse.Object._classMap[className];
      // This new subclass has been told to extend both from "this" and from
      // OldClassObject. This is multiple inheritance, which isn't supported.
      // For now, let's just pick one.
      NewClassObject = OldClassObject._extend(protoProps, classProps);
    } else {
      NewClassObject = this._extend(protoProps, classProps);
    }
    // Extending a subclass should reuse the classname automatically.
    NewClassObject.extend = function(arg0) {
      if (_.isString(arg0) || (arg0 && _.has(arg0, "className"))) {
        return Parse.Object.extend.apply(NewClassObject, arguments);
      }
      var newArguments = [className].concat(Parse._.toArray(arguments));
      return Parse.Object.extend.apply(NewClassObject, newArguments);
    };
    Parse.Object._classMap[className] = NewClassObject;
    return NewClassObject;
  };

  Parse.Object._findUnsavedChildren = function(object, children, files) {
    Parse._traverse(object, function(object) {
      if (object instanceof Parse.Object) {
        object._refreshCache();
        if (object.dirty()) {
          children.push(object);
        }
        return;
      }

      if (object instanceof Parse.File) {
        if (!object.url()) {
          files.push(object);
        }
        return;
      }
    });
  };

  Parse.Object._canBeSerializedAsValue = function(object) {
    
    if (object instanceof Parse.Object) {
      return !!object.id;
    }
    if (object instanceof Parse.File) {
      // Don't recurse indefinitely into files.
      return true;
    }

    var canBeSerializedAsValue = true;

    if (_.isArray(object)) {
      Parse._arrayEach(object, function(child) {
        if (!Parse.Object._canBeSerializedAsValue(child)) {
          canBeSerializedAsValue = false;
        }
      });
    } else if (_.isObject(object)) {
      Parse._objectEach(object, function(child) {
        if (!Parse.Object._canBeSerializedAsValue(child)) {
          canBeSerializedAsValue = false;
        }
      });
    }
    return canBeSerializedAsValue;
  };

  /**
   * @param {Object} object The root object.
   * @param {Object} options: The only valid option is useMasterKey.
   */
  Parse.Object._deepSaveAsync = function(object, options) {
    var unsavedChildren = [];
    var unsavedFiles = [];
    Parse.Object._findUnsavedChildren(object, unsavedChildren, unsavedFiles);

    var promise = Parse.Promise.as();
    _.each(unsavedFiles, function(file) {
      promise = promise.then(function() {
        return file.save(options);
      });
    });

    var objects = _.uniq(unsavedChildren);
    var remaining = _.uniq(objects);

    return promise.then(function() {
      return Parse.Promise._continueWhile(function() {
        return remaining.length > 0;
      }, function() {

        // Gather up all the objects that can be saved in this batch.
        var batch = [];
        var newRemaining = [];
        Parse._arrayEach(remaining, function(object) {
          // Limit batches to 20 objects.
          if (batch.length > 20) {
            newRemaining.push(object);
            return;
          }

          if (object._canBeSerialized()) {
            batch.push(object);
          } else {
            newRemaining.push(object);
          }
        });
        remaining = newRemaining;

        // If we can't save any objects, there must be a circular reference.
        if (batch.length === 0) {
          return Parse.Promise.error(
            new Parse.Error(Parse.Error.OTHER_CAUSE,
                            "Tried to save a batch with a cycle."));
        }

        // Reserve a spot in every object's save queue.
        var readyToStart = Parse.Promise.when(_.map(batch, function(object) {
          return object._allPreviousSaves || Parse.Promise.as();
        }));
        var batchFinished = new Parse.Promise();
        Parse._arrayEach(batch, function(object) {
          object._allPreviousSaves = batchFinished;
        });

        // Save a single batch, whether previous saves succeeded or failed.
        return readyToStart._continueWith(function() {
          return Parse._request({
            route: "batch",
            method: "POST",
            useMasterKey: options.useMasterKey,
            data: {
              requests: _.map(batch, function(object) {
                var json = object._getSaveJSON();
                var method = "POST";
  
                var path = "/1/classes/" + object.className;
                if (object.id) {
                  path = path + "/" + object.id;
                  method = "PUT";
                }
  
                object._startSave();
  
                return {
                  method: method,
                  path: path,
                  body: json
                };
              })
            }
          }).then(function(response, status, xhr) {
            var error;
            Parse._arrayEach(batch, function(object, i) {
              if (response[i].success) {
                object._finishSave(
                  object.parse(response[i].success, status, xhr));
              } else {
                error = error || response[i].error;
                object._cancelSave();
              }
            });
            if (error) {
              return Parse.Promise.error(
                new Parse.Error(error.code, error.error));
            }

          }).then(function(results) {
            batchFinished.resolve(results);
            return results;
          }, function(error) {
            batchFinished.reject(error);
            return Parse.Promise.error(error);
          });
        });
      });
    }).then(function() {
      return object;
    });
  };

}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Represents a Role on the Parse server. Roles represent groupings of
   * Users for the purposes of granting permissions (e.g. specifying an ACL
   * for an Object). Roles are specified by their sets of child users and
   * child roles, all of which are granted any permissions that the parent
   * role has.
   *
   * <p>Roles must have a name (which cannot be changed after creation of the
   * role), and must specify an ACL.</p>
   * @class
   * A Parse.Role is a local representation of a role persisted to the Parse
   * cloud.
   */
  Parse.Role = Parse.Object.extend("_Role", /** @lends Parse.Role.prototype */ {
    // Instance Methods
    
    /**
     * Constructs a new ParseRole with the given name and ACL.
     * 
     * @param {String} name The name of the Role to create.
     * @param {Parse.ACL} acl The ACL for this role. Roles must have an ACL.
     */
    constructor: function(name, acl) {
      if (_.isString(name) && (acl instanceof Parse.ACL)) {
        Parse.Object.prototype.constructor.call(this, null, null);
        this.setName(name);
        this.setACL(acl);
      } else {
        Parse.Object.prototype.constructor.call(this, name, acl);
      }
    },
    
    /**
     * Gets the name of the role.  You can alternatively call role.get("name")
     * 
     * @return {String} the name of the role.
     */
    getName: function() {
      return this.get("name");
    },
    
    /**
     * Sets the name for a role. This value must be set before the role has
     * been saved to the server, and cannot be set once the role has been
     * saved.
     * 
     * <p>
     *   A role's name can only contain alphanumeric characters, _, -, and
     *   spaces.
     * </p>
     *
     * <p>This is equivalent to calling role.set("name", name)</p>
     * 
     * @param {String} name The name of the role.
     * @param {Object} options Standard options object with success and error
     *     callbacks.
     */
    setName: function(name, options) {
      return this.set("name", name, options);
    },
    
    /**
     * Gets the Parse.Relation for the Parse.Users that are direct
     * children of this role. These users are granted any privileges that this
     * role has been granted (e.g. read or write access through ACLs). You can
     * add or remove users from the role through this relation.
     * 
     * <p>This is equivalent to calling role.relation("users")</p>
     * 
     * @return {Parse.Relation} the relation for the users belonging to this
     *     role.
     */
    getUsers: function() {
      return this.relation("users");
    },
    
    /**
     * Gets the Parse.Relation for the Parse.Roles that are direct
     * children of this role. These roles' users are granted any privileges that
     * this role has been granted (e.g. read or write access through ACLs). You
     * can add or remove child roles from this role through this relation.
     * 
     * <p>This is equivalent to calling role.relation("roles")</p>
     * 
     * @return {Parse.Relation} the relation for the roles belonging to this
     *     role.
     */
    getRoles: function() {
      return this.relation("roles");
    },
    
    /**
     * @ignore
     */
    validate: function(attrs, options) {
      if ("name" in attrs && attrs.name !== this.getName()) {
        var newName = attrs.name;
        if (this.id && this.id !== attrs.objectId) {
          // Check to see if the objectId being set matches this.id.
          // This happens during a fetch -- the id is set before calling fetch.
          // Let the name be set in this case.
          return new Parse.Error(Parse.Error.OTHER_CAUSE,
              "A role's name can only be set before it has been saved.");
        }
        if (!_.isString(newName)) {
          return new Parse.Error(Parse.Error.OTHER_CAUSE,
              "A role's name must be a String.");
        }
        if (!(/^[0-9a-zA-Z\-_ ]+$/).test(newName)) {
          return new Parse.Error(Parse.Error.OTHER_CAUSE,
              "A role's name can only contain alphanumeric characters, _," +
              " -, and spaces.");
        }
      }
      if (Parse.Object.prototype.validate) {
        return Parse.Object.prototype.validate.call(this, attrs, options);
      }
      return false;
    }
  });
}(this));


/*global _: false */
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creates a new instance with the given models and options.  Typically, you
   * will not call this method directly, but will instead make a subclass using
   * <code>Parse.Collection.extend</code>.
   *
   * @param {Array} models An array of instances of <code>Parse.Object</code>.
   *
   * @param {Object} options An optional object with Backbone-style options.
   * Valid options are:<ul>
   *   <li>model: The Parse.Object subclass that this collection contains.
   *   <li>query: An instance of Parse.Query to use when fetching items.
   *   <li>comparator: A string property name or function to sort by.
   * </ul>
   *
   * @see Parse.Collection.extend
   *
   * @class
   *
   * <p>Provides a standard collection class for our sets of models, ordered
   * or unordered.  For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#Collection">Backbone
   * documentation</a>.</p>
   */
  Parse.Collection = function(models, options) {
    options = options || {};
    if (options.comparator) {
      this.comparator = options.comparator;
    }
    if (options.model) {
      this.model = options.model;
    }
    if (options.query) {
      this.query = options.query;
    }
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) {
      this.reset(models, {silent: true, parse: options.parse});
    }
  };

  // Define the Collection's inheritable methods.
  _.extend(Parse.Collection.prototype, Parse.Events,
      /** @lends Parse.Collection.prototype */ {

    // The default model for a collection is just a Parse.Object.
    // This should be overridden in most cases.
    
    model: Parse.Object,

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    /**
     * The JSON representation of a Collection is an array of the
     * models' attributes.
     */
    toJSON: function() {
      return this.map(function(model){ return model.toJSON(); });
    },

    /**
     * Add a model, or list of models to the set. Pass **silent** to avoid
     * firing the `add` event for every new model.
     *
     * @param {Array} models An array of instances of <code>Parse.Object</code>.
     *
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>at: The index at which to add the models.
     *   <li>silent: Set to true to avoid firing the `add` event for every new
     *   model.
     * </ul>
     */
    add: function(models, options) {
      var i, index, length, model, cid, id, cids = {}, ids = {};
      options = options || {};
      models = _.isArray(models) ? models.slice() : [models];

      // Begin by turning bare objects into model references, and preventing
      // invalid models or duplicate models from being added.
      for (i = 0, length = models.length; i < length; i++) {
        models[i] = this._prepareModel(models[i], options);
        model = models[i];
        if (!model) {
          throw new Error("Can't add an invalid model to a collection");
        }
        cid = model.cid;
        if (cids[cid] || this._byCid[cid]) {
          throw new Error("Duplicate cid: can't add the same model " +
                          "to a collection twice");
        }
        id = model.id;
        if (!Parse._isNullOrUndefined(id) && (ids[id] || this._byId[id])) {
          throw new Error("Duplicate id: can't add the same model " +
                          "to a collection twice");
        }
        ids[id] = model;
        cids[cid] = model;
      }

      // Listen to added models' events, and index models for lookup by
      // `id` and by `cid`.
      for (i = 0; i < length; i++) {
        (model = models[i]).on('all', this._onModelEvent, this);
        this._byCid[model.cid] = model;
        if (model.id) {
          this._byId[model.id] = model;
        }
      }

      // Insert models into the collection, re-sorting if needed, and triggering
      // `add` events unless silenced.
      this.length += length;
      index = Parse._isNullOrUndefined(options.at) ? 
          this.models.length : options.at;
      this.models.splice.apply(this.models, [index, 0].concat(models));
      if (this.comparator) {
        this.sort({silent: true});
      }
      if (options.silent) {
        return this;
      }
      for (i = 0, length = this.models.length; i < length; i++) {
        model = this.models[i];
        if (cids[model.cid]) {
          options.index = i;
          model.trigger('add', model, this, options);
        }
      }
      return this;
    },

    /**
     * Remove a model, or a list of models from the set. Pass silent to avoid
     * firing the <code>remove</code> event for every model removed.
     *
     * @param {Array} models The model or list of models to remove from the
     *   collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are: <ul>
     *   <li>silent: Set to true to avoid firing the `remove` event.
     * </ul>
     */
    remove: function(models, options) {
      var i, l, index, model;
      options = options || {};
      models = _.isArray(models) ? models.slice() : [models];
      for (i = 0, l = models.length; i < l; i++) {
        model = this.getByCid(models[i]) || this.get(models[i]);
        if (!model) {
          continue;
        }
        delete this._byId[model.id];
        delete this._byCid[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    /**
     * Gets a model from the set by id.
     * @param {String} id The Parse objectId identifying the Parse.Object to
     * fetch from this collection.
     */
    get: function(id) {
      return id && this._byId[id.id || id];
    },

    /**
     * Gets a model from the set by client id.
     * @param {} cid The Backbone collection id identifying the Parse.Object to
     * fetch from this collection.
     */
    getByCid: function(cid) {
      return cid && this._byCid[cid.cid || cid];
    },

    /**
     * Gets the model at the given index.
     *
     * @param {Number} index The index of the model to return.
     */
    at: function(index) {
      return this.models[index];
    },

    /**
     * Forces the collection to re-sort itself. You don't need to call this
     * under normal circumstances, as the set will maintain sort order as each
     * item is added.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are: <ul>
     *   <li>silent: Set to true to avoid firing the `reset` event.
     * </ul>
     */
    sort: function(options) {
      options = options || {};
      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }
      var boundComparator = _.bind(this.comparator, this);
      if (this.comparator.length === 1) {
        this.models = this.sortBy(boundComparator);
      } else {
        this.models.sort(boundComparator);
      }
      if (!options.silent) {
        this.trigger('reset', this, options);
      }
      return this;
    },

    /**
     * Plucks an attribute from each model in the collection.
     * @param {String} attr The attribute to return from each model in the
     * collection.
     */
    pluck: function(attr) {
      return _.map(this.models, function(model){ return model.get(attr); });
    },

    /**
     * When you have more items than you want to add or remove individually,
     * you can reset the entire set with a new list of models, without firing
     * any `add` or `remove` events. Fires `reset` when finished.
     *
     * @param {Array} models The model or list of models to remove from the
     *   collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are: <ul>
     *   <li>silent: Set to true to avoid firing the `reset` event.
     * </ul>
     */
    reset: function(models, options) {
      var self = this;
      models = models || [];
      options = options || {};
      Parse._arrayEach(this.models, function(model) {
        self._removeReference(model);
      });
      this._reset();
      this.add(models, {silent: true, parse: options.parse});
      if (!options.silent) {
        this.trigger('reset', this, options);
      }
      return this;
    },

    /**
     * Fetches the default set of models for this collection, resetting the
     * collection when they arrive. If `add: true` is passed, appends the
     * models to the collection instead of resetting.
     *
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>silent: Set to true to avoid firing `add` or `reset` events for
     *   models fetched by this fetch.
     *   <li>success: A Backbone-style success callback.
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, uses the Master Key for
     *       this request.
     * </ul>
     */
    fetch: function(options) {
      options = _.clone(options) || {};
      if (options.parse === undefined) {
        options.parse = true;
      }
      var collection = this;
      var query = this.query || new Parse.Query(this.model);
      return query.find({
        useMasterKey: options.useMasterKey
      }).then(function(results) {
        if (options.add) {
          collection.add(results, options);
        } else {
          collection.reset(results, options);
        }
        return collection;
      })._thenRunCallbacks(options, this);
    },

    /**
     * Creates a new instance of a model in this collection. Add the model to
     * the collection immediately, unless `wait: true` is passed, in which case
     * we wait for the server to agree.
     *
     * @param {Parse.Object} model The new model to create and add to the
     *   collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>wait: Set to true to wait for the server to confirm creation of the
     *       model before adding it to the collection.
     *   <li>silent: Set to true to avoid firing an `add` event.
     *   <li>success: A Backbone-style success callback.
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, uses the Master Key for
     *       this request.
     * </ul>
     */
    create: function(model, options) {
      var coll = this;
      options = options ? _.clone(options) : {};
      model = this._prepareModel(model, options);
      if (!model) {
        return false;
      }
      if (!options.wait) {
        coll.add(model, options);
      }
      var success = options.success;
      options.success = function(nextModel, resp, xhr) {
        if (options.wait) {
          coll.add(nextModel, options);
        }
        if (success) {
          success(nextModel, resp);
        } else {
          nextModel.trigger('sync', model, resp, options);
        }
      };
      model.save(null, options);
      return model;
    },

    /**
     * Converts a response into a list of models to be added to the collection.
     * The default implementation is just to pass it through.
     * @ignore
     */
    parse: function(resp, xhr) {
      return resp;
    },

    /**
     * Proxy to _'s chain. Can't be proxied the same way the rest of the
     * underscore methods are proxied because it relies on the underscore
     * constructor.
     */
    chain: function() {
      return _(this.models).chain();
    },

    /**
     * Reset all internal state. Called when the collection is reset.
     */
    _reset: function(options) {
      this.length = 0;
      this.models = [];
      this._byId  = {};
      this._byCid = {};
    },

    /**
     * Prepare a model or hash of attributes to be added to this collection.
     */
    _prepareModel: function(model, options) {
      if (!(model instanceof Parse.Object)) {
        var attrs = model;
        options.collection = this;
        model = new this.model(attrs, options);
        if (!model._validate(model.attributes, options)) {
          model = false;
        }
      } else if (!model.collection) {
        model.collection = this;
      }
      return model;
    },

    /**
     * Internal method to remove a model's ties to a collection.
     */
    _removeReference: function(model) {
      if (this === model.collection) {
        delete model.collection;
      }
      model.off('all', this._onModelEvent, this);
    },

    /**
     * Internal method called every time a model in the set fires an event.
     * Sets need to update their indexes when models change ids. All other
     * events simply proxy through. "add" and "remove" events that originate
     * in other collections are ignored.
     */
    _onModelEvent: function(ev, model, collection, options) {
      if ((ev === 'add' || ev === 'remove') && collection !== this) {
        return;
      }
      if (ev === 'destroy') {
        this.remove(model, options);
      }
      if (model && ev === 'change:objectId') {
        delete this._byId[model.previous("objectId")];
        this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find',
    'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any',
    'include', 'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex',
    'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf',
    'shuffle', 'lastIndexOf', 'isEmpty', 'groupBy'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  Parse._arrayEach(methods, function(method) {
    Parse.Collection.prototype[method] = function() {
      return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
    };
  });

  /**
   * Creates a new subclass of <code>Parse.Collection</code>.  For example,<pre>
   *   var MyCollection = Parse.Collection.extend({
   *     // Instance properties
   *
   *     model: MyClass,
   *     query: MyQuery,
   *
   *     getFirst: function() {
   *       return this.at(0);
   *     }
   *   }, {
   *     // Class properties
   *
   *     makeOne: function() {
   *       return new MyCollection();
   *     }
   *   });
   *
   *   var collection = new MyCollection();
   * </pre>
   *
   * @function
   * @param {Object} instanceProps Instance properties for the collection.
   * @param {Object} classProps Class properies for the collection.
   * @return {Class} A new subclass of <code>Parse.Collection</code>.
   */
  Parse.Collection.extend = Parse._extend;

}(this));

/*global _: false, document: false */
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creating a Parse.View creates its initial element outside of the DOM,
   * if an existing element is not provided...
   * @class
   *
   * <p>A fork of Backbone.View, provided for your convenience.  If you use this
   * class, you must also include jQuery, or another library that provides a
   * jQuery-compatible $ function.  For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#View">Backbone
   * documentation</a>.</p>
   * <p><strong><em>Available in the client SDK only.</em></strong></p>
   */
  Parse.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var eventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes',
                     'className', 'tagName'];

  // Set up all inheritable **Parse.View** properties and methods.
  _.extend(Parse.View.prototype, Parse.Events,
           /** @lends Parse.View.prototype */ {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    /**
     * jQuery delegate for element lookup, scoped to DOM elements within the
     * current view. This should be prefered to global lookups where possible.
     */
    $: function(selector) {
      return this.$el.find(selector);
    },

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    /**
     * The core function that your view should override, in order
     * to populate its element (`this.el`), with the appropriate HTML. The
     * convention is for **render** to always return `this`.
     */
    render: function() {
      return this;
    },

    /**
     * Remove this view from the DOM. Note that the view isn't present in the
     * DOM by default, so calling this method may be a no-op.
     */
    remove: function() {
      this.$el.remove();
      return this;
    },

    /**
     * For small amounts of DOM Elements, where a full-blown template isn't
     * needed, use **make** to manufacture elements, one at a time.
     * <pre>
     *     var el = this.make('li', {'class': 'row'},
     *                        this.model.escape('title'));</pre>
     */
    make: function(tagName, attributes, content) {
      var el = document.createElement(tagName);
      if (attributes) {
        Parse.$(el).attr(attributes);
      }
      if (content) {
        Parse.$(el).html(content);
      }
      return el;
    },

    /**
     * Changes the view's element (`this.el` property), including event
     * re-delegation.
     */
    setElement: function(element, delegate) {
      this.$el = Parse.$(element);
      this.el = this.$el[0];
      if (delegate !== false) {
        this.delegateEvents();
      }
      return this;
    },

    /**
     * Set callbacks.  <code>this.events</code> is a hash of
     * <pre>
     * *{"event selector": "callback"}*
     *
     *     {
     *       'mousedown .title':  'edit',
     *       'click .button':     'save'
     *       'click .open':       function(e) { ... }
     *     }
     * </pre>
     * pairs. Callbacks will be bound to the view, with `this` set properly.
     * Uses event delegation for efficiency.
     * Omitting the selector binds the event to `this.el`.
     * This only works for delegate-able events: not `focus`, `blur`, and
     * not `change`, `submit`, and `reset` in Internet Explorer.
     */
    delegateEvents: function(events) {
      events = events || Parse._getValue(this, 'events');
      if (!events) {
        return;
      }
      this.undelegateEvents();
      var self = this;
      Parse._objectEach(events, function(method, key) {
        if (!_.isFunction(method)) {
          method = self[events[key]];
        }
        if (!method) {
          throw new Error('Event "' + events[key] + '" does not exist');
        }
        var match = key.match(eventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, self);
        eventName += '.delegateEvents' + self.cid;
        if (selector === '') {
          self.$el.bind(eventName, method);
        } else {
          self.$el.delegate(selector, eventName, method);
        }
      });
    },

    /**
     * Clears all callbacks previously bound to the view with `delegateEvents`.
     * You usually don't need to use this, but may wish to if you have multiple
     * Backbone views attached to the same DOM element.
     */
    undelegateEvents: function() {
      this.$el.unbind('.delegateEvents' + this.cid);
    },

    /**
     * Performs the initial configuration of a View with a set of options.
     * Keys with special meaning *(model, collection, id, className)*, are
     * attached directly to the view.
     */
    _configure: function(options) {
      if (this.options) {
        options = _.extend({}, this.options, options);
      }
      var self = this;
      _.each(viewOptions, function(attr) {
        if (options[attr]) {
          self[attr] = options[attr];
        }
      });
      this.options = options;
    },

    /**
     * Ensure that the View has a DOM element to render into.
     * If `this.el` is a string, pass it through `$()`, take the first
     * matching element, and re-assign it to `el`. Otherwise, create
     * an element from the `id`, `className` and `tagName` properties.
     */
    _ensureElement: function() {
      if (!this.el) {
        var attrs = Parse._getValue(this, 'attributes') || {};
        if (this.id) {
          attrs.id = this.id;
        }
        if (this.className) {
          attrs['class'] = this.className;
        }
        this.setElement(this.make(this.tagName, attrs), false);
      } else {
        this.setElement(this.el, false);
      }
    }

  });

  /**
   * @function
   * @param {Object} instanceProps Instance properties for the view.
   * @param {Object} classProps Class properies for the view.
   * @return {Class} A new subclass of <code>Parse.View</code>.
   */
  Parse.View.extend = Parse._extend;

}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * @class
   *
   * <p>A Parse.User object is a local representation of a user persisted to the
   * Parse cloud. This class is a subclass of a Parse.Object, and retains the
   * same functionality of a Parse.Object, but also extends it with various
   * user specific methods, like authentication, signing up, and validation of
   * uniqueness.</p>
   */
  Parse.User = Parse.Object.extend("_User", /** @lends Parse.User.prototype */ {
    // Instance Variables
    _isCurrentUser: false,


    // Instance Methods
    
    /**
     * Merges another object's attributes into this object.
     */
    _mergeFromObject: function(other) {
      if (other.getSessionToken()) {
        this._sessionToken = other.getSessionToken();      
      }    
      Parse.User.__super__._mergeFromObject.call(this, other);
    },    

    /**
     * Internal method to handle special fields in a _User response.
     */
    _mergeMagicFields: function(attrs) {
      if (attrs.sessionToken) {
        this._sessionToken = attrs.sessionToken;
        delete attrs.sessionToken;
      }
      Parse.User.__super__._mergeMagicFields.call(this, attrs);
    },

    /**
     * Removes null values from authData (which exist temporarily for
     * unlinking)
     */
    _cleanupAuthData: function() {
      if (!this.isCurrent()) {
        return;
      }
      var authData = this.get('authData');
      if (!authData) {
        return;
      }
      Parse._objectEach(this.get('authData'), function(value, key) {
        if (!authData[key]) {
          delete authData[key];
        }
      });
    },

    /**
     * Synchronizes authData for all providers.
     */
    _synchronizeAllAuthData: function() {
      var authData = this.get('authData');
      if (!authData) {
        return;
      }

      var self = this;
      Parse._objectEach(this.get('authData'), function(value, key) {
        self._synchronizeAuthData(key);
      });
    },

    /**
     * Synchronizes auth data for a provider (e.g. puts the access token in the
     * right place to be used by the Facebook SDK).
     */
    _synchronizeAuthData: function(provider) {
      if (!this.isCurrent()) {
        return;
      }
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = Parse.User._authProviders[authType];
      } else {
        authType = provider.getAuthType();
      }
      var authData = this.get('authData');
      if (!authData || !provider) {
        return;
      }
      var success = provider.restoreAuthentication(authData[authType]);
      if (!success) {
        this._unlinkFrom(provider);
      }
    },

    _handleSaveResult: function(makeCurrent) {
      // Clean up and synchronize the authData object, removing any unset values
      if (makeCurrent) {
        this._isCurrentUser = true;
      }
      this._cleanupAuthData();
      this._synchronizeAllAuthData();
      // Don't keep the password around.
      delete this._serverData.password;
      this._rebuildEstimatedDataForKey("password");
      this._refreshCache();
      if (makeCurrent || this.isCurrent()) {
        Parse.User._saveCurrentUser(this);
      }
    },

    /**
     * Unlike in the Android/iOS SDKs, logInWith is unnecessary, since you can
     * call linkWith on the user (even if it doesn't exist yet on the server).
     */
    _linkWith: function(provider, options) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = Parse.User._authProviders[provider];
      } else {
        authType = provider.getAuthType();
      }
      if (_.has(options, 'authData')) {
        var authData = this.get('authData') || {};
        authData[authType] = options.authData;
        this.set('authData', authData);

        // Overridden so that the user can be made the current user.
        var newOptions = _.clone(options) || {};
        newOptions.success = function(model) {
          model._handleSaveResult(true);
          if (options.success) {
            options.success.apply(this, arguments);
          }
        };
        return this.save({'authData': authData}, newOptions);
      } else {
        var self = this;
        var promise = new Parse.Promise();
        provider.authenticate({
          success: function(provider, result) {
            self._linkWith(provider, {
              authData: result,
              success: options.success,
              error: options.error
            }).then(function() {
              promise.resolve(self);
            });
          },
          error: function(provider, error) {
            if (options.error) {
              options.error(self, error);
            }
            promise.reject(error);
          }
        });
        return promise;
      }
    },

    /**
     * Unlinks a user from a service.
     */
    _unlinkFrom: function(provider, options) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = Parse.User._authProviders[provider];
      } else {
        authType = provider.getAuthType();
      }
      var newOptions = _.clone(options);
      var self = this;
      newOptions.authData = null;
      newOptions.success = function(model) {
        self._synchronizeAuthData(provider);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this._linkWith(provider, newOptions);
    },

    /**
     * Checks whether a user is linked to a service.
     */
    _isLinked: function(provider) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
      } else {
        authType = provider.getAuthType();
      }
      var authData = this.get('authData') || {};
      return !!authData[authType];
    },

    /**
     * Deauthenticates all providers.
     */
    _logOutWithAll: function() {
      var authData = this.get('authData');
      if (!authData) {
        return;
      }
      var self = this;
      Parse._objectEach(this.get('authData'), function(value, key) {
        self._logOutWith(key);
      });
    },

    /**
     * Deauthenticates a single provider (e.g. removing access tokens from the
     * Facebook SDK).
     */
    _logOutWith: function(provider) {
      if (!this.isCurrent()) {
        return;
      }
      if (_.isString(provider)) {
        provider = Parse.User._authProviders[provider];
      }
      if (provider && provider.deauthenticate) {
        provider.deauthenticate();
      }
    },

    /**
     * Signs up a new user. You should call this instead of save for
     * new Parse.Users. This will create a new Parse.User on the server, and
     * also persist the session on disk so that you can access the user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling signUp.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} attrs Extra fields to set on the new user, or null.
     * @param {Object} options A Backbone-style options object.
     * @return {Parse.Promise} A promise that is fulfilled when the signup
     *     finishes.
     * @see Parse.User.signUp
     */
    signUp: function(attrs, options) {
      var error;
      options = options || {};

      var username = (attrs && attrs.username) || this.get("username");
      if (!username || (username === "")) {
        error = new Parse.Error(
            Parse.Error.OTHER_CAUSE,
            "Cannot sign up user with an empty name.");
        if (options && options.error) {
          options.error(this, error);
        }
        return Parse.Promise.error(error);
      }

      var password = (attrs && attrs.password) || this.get("password");
      if (!password || (password === "")) {
        error = new Parse.Error(
            Parse.Error.OTHER_CAUSE,
            "Cannot sign up user with an empty password.");
        if (options && options.error) {
          options.error(this, error);
        }
        return Parse.Promise.error(error);
      }

      // Overridden so that the user can be made the current user.
      var newOptions = _.clone(options);
      newOptions.success = function(model) {
        model._handleSaveResult(true);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this.save(attrs, newOptions);
    },

    /**
     * Logs in a Parse.User. On success, this saves the session to localStorage,
     * so you can retrieve the currently logged in user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling logIn.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} options A Backbone-style options object.
     * @see Parse.User.logIn
     * @return {Parse.Promise} A promise that is fulfilled with the user when
     *     the login is complete.
     */
    logIn: function(options) {
      var model = this;
      options = options || {};
      var request = Parse._request({
        route: "login",
        method: "GET",
        useMasterKey: options.useMasterKey,
        data: this.toJSON()
      });
      return request.then(function(resp, status, xhr) {
        var serverAttrs = model.parse(resp, status, xhr);
        model._finishFetch(serverAttrs);
        model._handleSaveResult(true);
        return model;
      })._thenRunCallbacks(options, this);
    },

    /**
     * @see Parse.Object#save
     */
    save: function(arg1, arg2, arg3) {
      var i, attrs, current, options, saved;
      if (_.isObject(arg1) || _.isNull(arg1) || _.isUndefined(arg1)) {
        attrs = arg1;
        options = arg2;
      } else {
        attrs = {};
        attrs[arg1] = arg2;
        options = arg3;
      }
      options = options || {};

      var newOptions = _.clone(options);
      newOptions.success = function(model) {
        model._handleSaveResult(false);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return Parse.Object.prototype.save.call(this, attrs, newOptions);
    },

    /**
     * @see Parse.Object#fetch
     */
    fetch: function(options) {
      var newOptions = options ? _.clone(options) : {};
      newOptions.success = function(model) {
        model._handleSaveResult(false);
        if (options && options.success) {
          options.success.apply(this, arguments);
        }
      };
      return Parse.Object.prototype.fetch.call(this, newOptions);
    },

    /**
     * Returns true if <code>current</code> would return this user.
     * @see Parse.User#current
     */
    isCurrent: function() {
      return this._isCurrentUser;
    },

    /**
     * Returns get("username").
     * @return {String}
     * @see Parse.Object#get
     */
    getUsername: function() {
      return this.get("username");
    },

    /**
     * Calls set("username", username, options) and returns the result.
     * @param {String} username
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see Parse.Object.set
     */
    setUsername: function(username, options) {
      return this.set("username", username, options);
    },

    /**
     * Calls set("password", password, options) and returns the result.
     * @param {String} password
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see Parse.Object.set
     */
    setPassword: function(password, options) {
      return this.set("password", password, options);
    },

    /**
     * Returns get("email").
     * @return {String}
     * @see Parse.Object#get
     */
    getEmail: function() {
      return this.get("email");
    },

    /**
     * Calls set("email", email, options) and returns the result.
     * @param {String} email
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see Parse.Object.set
     */
    setEmail: function(email, options) {
      return this.set("email", email, options);
    },

    /**
     * Checks whether this user is the current user and has been authenticated.
     * @return (Boolean) whether this user is the current user and is logged in.
     */
    authenticated: function() {
      return !!this._sessionToken &&
          (Parse.User.current() && Parse.User.current().id === this.id);
    },

    /**
     * Returns the session token for this user, if the user has been logged in,
     * or if it is the result of a query with the master key. Otherwise, returns
     * undefined.
     * @return {String} the session token, or undefined
     */
    getSessionToken: function() {
      return this._sessionToken;
    }

  }, /** @lends Parse.User */ {
    // Class Variables

    // The currently logged-in user.
    _currentUser: null,

    // Whether currentUser is known to match the serialized version on disk.
    // This is useful for saving a localstorage check if you try to load
    // _currentUser frequently while there is none stored.
    _currentUserMatchesDisk: false,

    // The localStorage key suffix that the current user is stored under.
    _CURRENT_USER_KEY: "currentUser",

    // The mapping of auth provider names to actual providers
    _authProviders: {},

    // Whether to rewrite className User to _User
    _performUserRewrite: true,


    // Class Methods

    /**
     * Signs up a new user with a username (or email) and password.
     * This will create a new Parse.User on the server, and also persist the
     * session in localStorage so that you can access the user using
     * {@link #current}.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} username The username (or email) to sign up with.
     * @param {String} password The password to sign up with.
     * @param {Object} attrs Extra fields to set on the new user.
     * @param {Object} options A Backbone-style options object.
     * @return {Parse.Promise} A promise that is fulfilled with the user when
     *     the signup completes.
     * @see Parse.User#signUp
     */
    signUp: function(username, password, attrs, options) {
      attrs = attrs || {};
      attrs.username = username;
      attrs.password = password;
      var user = Parse.Object._create("_User");
      return user.signUp(attrs, options);
    },

    /**
     * Logs in a user with a username (or email) and password. On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} username The username (or email) to log in with.
     * @param {String} password The password to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {Parse.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see Parse.User#logIn
     */
    logIn: function(username, password, options) {
      var user = Parse.Object._create("_User");
      user._finishFetch({ username: username, password: password });
      return user.logIn(options);
    },

    /**
     * Logs in a user with a session token. On success, this saves the session
     * to disk, so you can retrieve the currently logged in user using
     * <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} sessionToken The sessionToken to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {Parse.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     */
    become: function(sessionToken, options) {
      options = options || {};

      var user = Parse.Object._create("_User");
      return Parse._request({
        route: "users",
        className: "me",
        method: "GET",
        useMasterKey: options.useMasterKey,
        sessionToken: sessionToken
      }).then(function(resp, status, xhr) {
        var serverAttrs = user.parse(resp, status, xhr);
        user._finishFetch(serverAttrs);
        user._handleSaveResult(true);
        return user;

      })._thenRunCallbacks(options, user);
    },

    /**
     * Logs out the currently logged in user session. This will remove the
     * session from disk, log out of linked services, and future calls to
     * <code>current</code> will return <code>null</code>.
     */
    logOut: function() {
      if (Parse.User._currentUser !== null) {
        Parse.User._currentUser._logOutWithAll();
        Parse.User._currentUser._isCurrentUser = false;
      }
      Parse.User._currentUserMatchesDisk = true;
      Parse.User._currentUser = null;
      Parse.localStorage.removeItem(
          Parse._getParsePath(Parse.User._CURRENT_USER_KEY));
    },

    /**
     * Requests a password reset email to be sent to the specified email address
     * associated with the user account. This email allows the user to securely
     * reset their password on the Parse site.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} email The email address associated with the user that
     *     forgot their password.
     * @param {Object} options A Backbone-style options object.
     */
    requestPasswordReset: function(email, options) {
      options = options || {};
      var request = Parse._request({
        route: "requestPasswordReset",
        method: "POST",
        useMasterKey: options.useMasterKey,
        data: { email: email }
      });
      return request._thenRunCallbacks(options);
    },

    /**
     * Retrieves the currently logged in ParseUser with a valid session,
     * either from memory or localStorage, if necessary.
     * @return {Parse.Object} The currently logged in Parse.User.
     */
    current: function() {
      if (Parse.User._currentUser) {
        return Parse.User._currentUser;
      }

      if (Parse.User._currentUserMatchesDisk) {
        
        return Parse.User._currentUser;
      }

      // Load the user from local storage.
      Parse.User._currentUserMatchesDisk = true;

      var userData = Parse.localStorage.getItem(Parse._getParsePath(
          Parse.User._CURRENT_USER_KEY));
      if (!userData) {
        
        return null;
      }
      Parse.User._currentUser = Parse.Object._create("_User");
      Parse.User._currentUser._isCurrentUser = true;

      var json = JSON.parse(userData);
      Parse.User._currentUser.id = json._id;
      delete json._id;
      Parse.User._currentUser._sessionToken = json._sessionToken;
      delete json._sessionToken;
      Parse.User._currentUser._finishFetch(json);

      Parse.User._currentUser._synchronizeAllAuthData();
      Parse.User._currentUser._refreshCache();
      Parse.User._currentUser._opSetQueue = [{}];
      return Parse.User._currentUser;
    },

    /**
     * Allow someone to define a custom User class without className
     * being rewritten to _User. The default behavior is to rewrite
     * User to _User for legacy reasons. This allows developers to
     * override that behavior.
     *
     * @param {Boolean} isAllowed Whether or not to allow custom User class
     */
    allowCustomUserClass: function(isAllowed) {
      this._performUserRewrite = !isAllowed;
    },

    /**
     * Persists a user as currentUser to localStorage, and into the singleton.
     */
    _saveCurrentUser: function(user) {
      if (Parse.User._currentUser !== user) {
        Parse.User.logOut();
      }
      user._isCurrentUser = true;
      Parse.User._currentUser = user;
      Parse.User._currentUserMatchesDisk = true;

      var json = user.toJSON();
      json._id = user.id;
      json._sessionToken = user._sessionToken;
      Parse.localStorage.setItem(
          Parse._getParsePath(Parse.User._CURRENT_USER_KEY),
          JSON.stringify(json));
    },

    _registerAuthenticationProvider: function(provider) {
      Parse.User._authProviders[provider.getAuthType()] = provider;
      // Synchronize the current user with the auth provider.
      if (Parse.User.current()) {
        Parse.User.current()._synchronizeAuthData(provider.getAuthType());
      }
    },

    _logInWith: function(provider, options) {
      var user = Parse.Object._create("_User");
      return user._linkWith(provider, options);
    }

  });
}(this));


// Parse.Query is a way to create a list of Parse.Objects.
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Creates a new parse Parse.Query for the given Parse.Object subclass.
   * @param objectClass -
   *   An instance of a subclass of Parse.Object, or a Parse className string.
   * @class
   *
   * <p>Parse.Query defines a query that is used to fetch Parse.Objects. The
   * most common use case is finding all objects that match a query through the
   * <code>find</code> method. For example, this sample code fetches all objects
   * of class <code>MyClass</code>. It calls a different function depending on
   * whether the fetch succeeded or not.
   * 
   * <pre>
   * var query = new Parse.Query(MyClass);
   * query.find({
   *   success: function(results) {
   *     // results is an array of Parse.Object.
   *   },
   *
   *   error: function(error) {
   *     // error is an instance of Parse.Error.
   *   }
   * });</pre></p>
   * 
   * <p>A Parse.Query can also be used to retrieve a single object whose id is
   * known, through the get method. For example, this sample code fetches an
   * object of class <code>MyClass</code> and id <code>myId</code>. It calls a
   * different function depending on whether the fetch succeeded or not.
   * 
   * <pre>
   * var query = new Parse.Query(MyClass);
   * query.get(myId, {
   *   success: function(object) {
   *     // object is an instance of Parse.Object.
   *   },
   *
   *   error: function(object, error) {
   *     // error is an instance of Parse.Error.
   *   }
   * });</pre></p>
   * 
   * <p>A Parse.Query can also be used to count the number of objects that match
   * the query without retrieving all of those objects. For example, this
   * sample code counts the number of objects of the class <code>MyClass</code>
   * <pre>
   * var query = new Parse.Query(MyClass);
   * query.count({
   *   success: function(number) {
   *     // There are number instances of MyClass.
   *   },
   *
   *   error: function(error) {
   *     // error is an instance of Parse.Error.
   *   }
   * });</pre></p>
   */
  Parse.Query = function(objectClass) {
    if (_.isString(objectClass)) {
      objectClass = Parse.Object._getSubclass(objectClass);
    }

    this.objectClass = objectClass;

    this.className = objectClass.prototype.className;

    this._where = {};
    this._include = [];
    this._limit = -1; // negative limit means, do not send a limit
    this._skip = 0;
    this._extraOptions = {};
  };

  /**
   * Constructs a Parse.Query that is the OR of the passed in queries.  For
   * example:
   * <pre>var compoundQuery = Parse.Query.or(query1, query2, query3);</pre>
   *
   * will create a compoundQuery that is an or of the query1, query2, and
   * query3.
   * @param {...Parse.Query} var_args The list of queries to OR.
   * @return {Parse.Query} The query that is the OR of the passed in queries.
   */
  Parse.Query.or = function() {
    var queries = _.toArray(arguments);
    var className = null;
    Parse._arrayEach(queries, function(q) {
      if (_.isNull(className)) {
        className = q.className;
      }

      if (className !== q.className) {
        throw "All queries must be for the same class";
      }
    });
    var query = new Parse.Query(className);
    query._orQuery(queries);
    return query;
  };

  Parse.Query.prototype = {
    /**
     * Constructs a Parse.Object whose id is already known by fetching data from
     * the server.  Either options.success or options.error is called when the
     * find completes.
     *
     * @param {String} objectId The id of the object to be fetched.
     * @param {Object} options A Backbone-style options object.
     * Valid options are:<ul>
     *   <li>success: A Backbone-style success callback
     *   <li>error: An Backbone-style error callback.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     */
    get: function(objectId, options) {
      var self = this;
      self.equalTo('objectId', objectId);

      var firstOptions = {};
      if (options && _.has(options, 'useMasterKey')) {
        firstOptions = { useMasterKey: options.useMasterKey };
      }

      return self.first(firstOptions).then(function(response) {
        if (response) {
          return response;
        }

        var errorObject = new Parse.Error(Parse.Error.OBJECT_NOT_FOUND,
                                          "Object not found.");
        return Parse.Promise.error(errorObject);

      })._thenRunCallbacks(options, null);
    },

    /**
     * Returns a JSON representation of this query.
     * @return {Object} The JSON representation of the query.
     */
    toJSON: function() {
      var params = {
        where: this._where
      };

      if (this._include.length > 0) {
        params.include = this._include.join(",");
      }
      if (this._select) {
        params.keys = this._select.join(",");
      }
      if (this._limit >= 0) {
        params.limit = this._limit;
      }
      if (this._skip > 0) {
        params.skip = this._skip;
      }
      if (this._order !== undefined) {
        params.order = this._order.join(",");
      }

      Parse._objectEach(this._extraOptions, function(v, k) {
        params[k] = v;
      });

      return params;
    },

    /**
     * Retrieves a list of ParseObjects that satisfy this query.
     * Either options.success or options.error is called when the find
     * completes.
     *
     * @param {Object} options A Backbone-style options object. Valid options
     * are:<ul>
     *   <li>success: Function to call when the find completes successfully.
     *   <li>error: Function to call when the find fails.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     *
     * @return {Parse.Promise} A promise that is resolved with the results when
     * the query completes.
     */
    find: function(options) {
      var self = this;
      options = options || {};

      var request = Parse._request({
        route: "classes",
        className: this.className,
        method: "GET",
        useMasterKey: options.useMasterKey,
        data: this.toJSON()
      });

      return request.then(function(response) {
        return _.map(response.results, function(json) {
          var obj;
          if (response.className) {
            obj = new Parse.Object(response.className);
          } else {
            obj = new self.objectClass();
          }
          obj._finishFetch(json, true);
          return obj;
        });
      })._thenRunCallbacks(options);
    },

    /**
     * Counts the number of objects that match this query.
     * Either options.success or options.error is called when the count
     * completes.
     *
     * @param {Object} options A Backbone-style options object. Valid options
     * are:<ul>
     *   <li>success: Function to call when the count completes successfully.
     *   <li>error: Function to call when the find fails.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     *
     * @return {Parse.Promise} A promise that is resolved with the count when
     * the query completes.
     */
    count: function(options) {
      var self = this;
      options = options || {};

      var params = this.toJSON();
      params.limit = 0;
      params.count = 1;
      var request = Parse._request({
        route: "classes",
        className: self.className, 
        method: "GET",
        useMasterKey: options.useMasterKey,
        data: params
      });

      return request.then(function(response) {
        return response.count;
      })._thenRunCallbacks(options);
    },

    /**
     * Retrieves at most one Parse.Object that satisfies this query.
     *
     * Either options.success or options.error is called when it completes.
     * success is passed the object if there is one. otherwise, undefined.
     *
     * @param {Object} options A Backbone-style options object. Valid options
     * are:<ul>
     *   <li>success: Function to call when the find completes successfully.
     *   <li>error: Function to call when the find fails.
     *   <li>useMasterKey: In Cloud Code and Node only, causes the Master Key to
     *     be used for this request.
     * </ul>
     *
     * @return {Parse.Promise} A promise that is resolved with the object when
     * the query completes.
     */
    first: function(options) {
      var self = this;
      options = options || {};

      var params = this.toJSON();
      params.limit = 1;
      var request = Parse._request({
        route: "classes",
        className: this.className, 
        method: "GET",
        useMasterKey: options.useMasterKey,
        data: params
      });

      return request.then(function(response) {
        return _.map(response.results, function(json) {
          var obj = new self.objectClass();
          obj._finishFetch(json, true);
          return obj;
        })[0];
      })._thenRunCallbacks(options);
    },

    /**
     * Returns a new instance of Parse.Collection backed by this query.
     * @param {Array} items An array of instances of <code>Parse.Object</code>
     *     with which to start this Collection.
     * @param {Object} options An optional object with Backbone-style options.
     * Valid options are:<ul>
     *   <li>model: The Parse.Object subclass that this collection contains.
     *   <li>query: An instance of Parse.Query to use when fetching items.
     *   <li>comparator: A string property name or function to sort by.
     * </ul>
     * @return {Parse.Collection}
     */
    collection: function(items, options) {
      options = options || {};
      return new Parse.Collection(items, _.extend(options, {
        model: this.objectClass,
        query: this
      }));
    },

    /**
     * Sets the number of results to skip before returning any results.
     * This is useful for pagination.
     * Default is to skip zero results.
     * @param {Number} n the number of results to skip.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    skip: function(n) {
      this._skip = n;
      return this;
    },

    /**
     * Sets the limit of the number of results to return. The default limit is
     * 100, with a maximum of 1000 results being returned at a time.
     * @param {Number} n the number of results to limit to.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    limit: function(n) {
      this._limit = n;
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that the Parse.Object must contain.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    equalTo: function(key, value) {
      if (_.isUndefined(value)) {
        return this.doesNotExist(key);
      } 

      this._where[key] = Parse._encode(value);
      return this;
    },

    /**
     * Helper for condition queries
     */
    _addCondition: function(key, condition, value) {
      // Check if we already have a condition
      if (!this._where[key]) {
        this._where[key] = {};
      }
      this._where[key][condition] = Parse._encode(value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be not equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that must not be equalled.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    notEqualTo: function(key, value) {
      this._addCondition(key, "$ne", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be less than the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an upper bound.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    lessThan: function(key, value) {
      this._addCondition(key, "$lt", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be greater than the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an lower bound.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    greaterThan: function(key, value) {
      this._addCondition(key, "$gt", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be less than or equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an upper bound.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    lessThanOrEqualTo: function(key, value) {
      this._addCondition(key, "$lte", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be greater than or equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an lower bound.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    greaterThanOrEqualTo: function(key, value) {
      this._addCondition(key, "$gte", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be contained in the provided list of values.
     * @param {String} key The key to check.
     * @param {Array} values The values that will match.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    containedIn: function(key, values) {
      this._addCondition(key, "$in", values);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * not be contained in the provided list of values.
     * @param {String} key The key to check.
     * @param {Array} values The values that will not match.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    notContainedIn: function(key, values) {
      this._addCondition(key, "$nin", values);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * contain each one of the provided list of values.
     * @param {String} key The key to check.  This key's value must be an array.
     * @param {Array} values The values that will match.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    containsAll: function(key, values) {
      this._addCondition(key, "$all", values);
      return this;
    },


    /**
     * Add a constraint for finding objects that contain the given key.
     * @param {String} key The key that should exist.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    exists: function(key) {
      this._addCondition(key, "$exists", true);
      return this;
    },

    /**
     * Add a constraint for finding objects that do not contain a given key.
     * @param {String} key The key that should not exist
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    doesNotExist: function(key) {
      this._addCondition(key, "$exists", false);
      return this;
    },

    /**
     * Add a regular expression constraint for finding string values that match
     * the provided regular expression.
     * This may be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {RegExp} regex The regular expression pattern to match.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    matches: function(key, regex, modifiers) {
      this._addCondition(key, "$regex", regex);
      if (!modifiers) { modifiers = ""; }
      // Javascript regex options support mig as inline options but store them 
      // as properties of the object. We support mi & should migrate them to
      // modifiers
      if (regex.ignoreCase) { modifiers += 'i'; }
      if (regex.multiline) { modifiers += 'm'; }

      if (modifiers && modifiers.length) {
        this._addCondition(key, "$options", modifiers);
      }
      return this;
    },

    /**
     * Add a constraint that requires that a key's value matches a Parse.Query
     * constraint.
     * @param {String} key The key that the contains the object to match the
     *                     query.
     * @param {Parse.Query} query The query that should match.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    matchesQuery: function(key, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$inQuery", queryJSON);
      return this;
    },

   /**
     * Add a constraint that requires that a key's value not matches a
     * Parse.Query constraint.
     * @param {String} key The key that the contains the object to match the
     *                     query.
     * @param {Parse.Query} query The query that should not match.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    doesNotMatchQuery: function(key, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$notInQuery", queryJSON);
      return this;
    },


    /**
     * Add a constraint that requires that a key's value matches a value in
     * an object returned by a different Parse.Query.
     * @param {String} key The key that contains the value that is being
     *                     matched.
     * @param {String} queryKey The key in the objects returned by the query to
     *                          match against.
     * @param {Parse.Query} query The query to run.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    matchesKeyInQuery: function(key, queryKey, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$select",
                         { key: queryKey, query: queryJSON });
      return this;
    },

    /**
     * Add a constraint that requires that a key's value not match a value in
     * an object returned by a different Parse.Query.
     * @param {String} key The key that contains the value that is being
     *                     excluded.
     * @param {String} queryKey The key in the objects returned by the query to
     *                          match against.
     * @param {Parse.Query} query The query to run.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    doesNotMatchKeyInQuery: function(key, queryKey, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$dontSelect",
                         { key: queryKey, query: queryJSON });
      return this;
    },

    /**
     * Add constraint that at least one of the passed in queries matches.
     * @param {Array} queries
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    _orQuery: function(queries) {
      var queryJSON = _.map(queries, function(q) {
        return q.toJSON().where;
      });

      this._where.$or = queryJSON;
      return this;
    },

    /**
     * Converts a string into a regex that matches it.
     * Surrounding with \Q .. \E does this, we just need to escape \E's in
     * the text separately.
     */
    _quote: function(s) {
      return "\\Q" + s.replace("\\E", "\\E\\\\E\\Q") + "\\E";
    },

    /**
     * Add a constraint for finding string values that contain a provided
     * string.  This may be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} substring The substring that the value must contain.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    contains: function(key, value) {
      this._addCondition(key, "$regex", this._quote(value));
      return this;
    },

    /**
     * Add a constraint for finding string values that start with a provided
     * string.  This query will use the backend index, so it will be fast even
     * for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} prefix The substring that the value must start with.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    startsWith: function(key, value) {
      this._addCondition(key, "$regex", "^" + this._quote(value));
      return this;
    },

    /**
     * Add a constraint for finding string values that end with a provided
     * string.  This will be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} suffix The substring that the value must end with.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    endsWith: function(key, value) {
      this._addCondition(key, "$regex", this._quote(value) + "$");
      return this;
    },

    /**
     * Sorts the results in ascending order by the given key.
     * 
     * @param {(String|String[]|...String} key The key to order by, which is a 
     * string of comma separated values, or an Array of keys, or multiple keys.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    ascending: function() {
      this._order = [];
      return this.addAscending.apply(this, arguments);
    },

    /**
     * Sorts the results in ascending order by the given key, 
     * but can also add secondary sort descriptors without overwriting _order.
     * 
     * @param {(String|String[]|...String} key The key to order by, which is a
     * string of comma separated values, or an Array of keys, or multiple keys.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    addAscending: function(key) {
      var self = this; 
      if (!this._order) {
        this._order = [];
      }
      Parse._arrayEach(arguments, function(key) {
        if (Array.isArray(key)) {
          key = key.join();
        }
        self._order = self._order.concat(key.replace(/\s/g, "").split(","));
      });
      return this;
    },

    /**
     * Sorts the results in descending order by the given key.
     * 
     * @param {(String|String[]|...String} key The key to order by, which is a
     * string of comma separated values, or an Array of keys, or multiple keys.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    descending: function(key) {
      this._order = [];
      return this.addDescending.apply(this, arguments);
    },

    /**
     * Sorts the results in descending order by the given key,
     * but can also add secondary sort descriptors without overwriting _order.
     * 
     * @param {(String|String[]|...String} key The key to order by, which is a
     * string of comma separated values, or an Array of keys, or multiple keys.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    addDescending: function(key) {
      var self = this; 
      if (!this._order) {
        this._order = [];
      }
      Parse._arrayEach(arguments, function(key) {
        if (Array.isArray(key)) {
          key = key.join();
        }
        self._order = self._order.concat(
          _.map(key.replace(/\s/g, "").split(","), 
            function(k) { return "-" + k; }));
      });
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given.
     * @param {String} key The key that the Parse.GeoPoint is stored in.
     * @param {Parse.GeoPoint} point The reference Parse.GeoPoint that is used.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    near: function(key, point) {
      if (!(point instanceof Parse.GeoPoint)) {
        // Try to cast it to a GeoPoint, so that near("loc", [20,30]) works.
        point = new Parse.GeoPoint(point);
      }
      this._addCondition(key, "$nearSphere", point);
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * @param {String} key The key that the Parse.GeoPoint is stored in.
     * @param {Parse.GeoPoint} point The reference Parse.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in radians) of results to
     *   return.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    withinRadians: function(key, point, distance) {
      this.near(key, point);
      this._addCondition(key, "$maxDistance", distance);
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * Radius of earth used is 3958.8 miles.
     * @param {String} key The key that the Parse.GeoPoint is stored in.
     * @param {Parse.GeoPoint} point The reference Parse.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in miles) of results to
     *     return.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    withinMiles: function(key, point, distance) {
      return this.withinRadians(key, point, distance / 3958.8);
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * Radius of earth used is 6371.0 kilometers.
     * @param {String} key The key that the Parse.GeoPoint is stored in.
     * @param {Parse.GeoPoint} point The reference Parse.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in kilometers) of results
     *     to return.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    withinKilometers: function(key, point, distance) {
      return this.withinRadians(key, point, distance / 6371.0);
    },

    /**
     * Add a constraint to the query that requires a particular key's
     * coordinates be contained within a given rectangular geographic bounding
     * box.
     * @param {String} key The key to be constrained.
     * @param {Parse.GeoPoint} southwest
     *     The lower-left inclusive corner of the box.
     * @param {Parse.GeoPoint} northeast
     *     The upper-right inclusive corner of the box.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    withinGeoBox: function(key, southwest, northeast) {
      if (!(southwest instanceof Parse.GeoPoint)) {
        southwest = new Parse.GeoPoint(southwest);
      }
      if (!(northeast instanceof Parse.GeoPoint)) {
        northeast = new Parse.GeoPoint(northeast);
      }
      this._addCondition(key, '$within', { '$box': [southwest, northeast] });
      return this;
    },

    /**
     * Include nested Parse.Objects for the provided key.  You can use dot
     * notation to specify which fields in the included object are also fetch.
     * @param {String} key The name of the key to include.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    include: function() {
      var self = this;
      Parse._arrayEach(arguments, function(key) {
        if (_.isArray(key)) {
          self._include = self._include.concat(key);
        } else {
          self._include.push(key);
        }
      });
      return this;
    },

    /**
     * Restrict the fields of the returned Parse.Objects to include only the
     * provided keys.  If this is called multiple times, then all of the keys
     * specified in each of the calls will be included.
     * @param {Array} keys The names of the keys to include.
     * @return {Parse.Query} Returns the query, so you can chain this call.
     */
    select: function() {
      var self = this;
      this._select = this._select || [];
      Parse._arrayEach(arguments, function(key) {
        if (_.isArray(key)) {
          self._select = self._select.concat(key);
        } else {
          self._select.push(key);
        }
      });
      return this;
    },

    /**
     * Iterates over each result of a query, calling a callback for each one. If
     * the callback returns a promise, the iteration will not continue until
     * that promise has been fulfilled. If the callback returns a rejected
     * promise, then iteration will stop with that error. The items are
     * processed in an unspecified order. The query may not have any sort order,
     * and may not use limit or skip.
     * @param {Function} callback Callback that will be called with each result
     *     of the query.
     * @param {Object} options An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     * @return {Parse.Promise} A promise that will be fulfilled once the
     *     iteration has completed.
     */
    each: function(callback, options) {
      options = options || {};

      if (this._order || this._skip || (this._limit >= 0)) {
        var error =
          "Cannot iterate on a query with sort, skip, or limit.";
        return Parse.Promise.error(error)._thenRunCallbacks(options);
      }

      var promise = new Parse.Promise();

      var query = new Parse.Query(this.objectClass);
      // We can override the batch size from the options.
      // This is undocumented, but useful for testing.
      query._limit = options.batchSize || 100;
      query._where = _.clone(this._where);
      query._include = _.clone(this._include);

      query.ascending('objectId');

      var finished = false;
      return Parse.Promise._continueWhile(function() {
        return !finished;

      }, function() {
        return query.find().then(function(results) {
          var callbacksDone = Parse.Promise.as();
          Parse._.each(results, function(result) {
            callbacksDone = callbacksDone.then(function() {
              return callback(result);
            });
          });

          return callbacksDone.then(function() {
            if (results.length >= query._limit) {
              query.greaterThan("objectId", results[results.length - 1].id);
            } else {
              finished = true;
            }
          });
        });
      })._thenRunCallbacks(options);
    }
  };

}(this));

/*global FB: false , console: false*/
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  var PUBLIC_KEY = "*";

  var initialized = false;
  var requestedPermissions;
  var initOptions;
  var provider = {
    authenticate: function(options) {
      var self = this;
      FB.login(function(response) {
        if (response.authResponse) {
          if (options.success) {
            options.success(self, {
              id: response.authResponse.userID,
              access_token: response.authResponse.accessToken,
              expiration_date: new Date(response.authResponse.expiresIn * 1000 +
                  (new Date()).getTime()).toJSON()
            });
          }
        } else {
          if (options.error) {
            options.error(self, response);
          }
        }
      }, {
        scope: requestedPermissions
      });
    },
    restoreAuthentication: function(authData) {
      if (authData) {
        var authResponse = {
          userID: authData.id,
          accessToken: authData.access_token,
          expiresIn: (Parse._parseDate(authData.expiration_date).getTime() -
              (new Date()).getTime()) / 1000
        };
        var newOptions = _.clone(initOptions);
        newOptions.authResponse = authResponse;

        // Suppress checks for login status from the browser.
        newOptions.status = false;

        // If the user doesn't match the one known by the FB SDK, log out.
        // Most of the time, the users will match -- it's only in cases where
        // the FB SDK knows of a different user than the one being restored
        // from a Parse User that logged in with username/password.
        var existingResponse = FB.getAuthResponse();
        if (existingResponse &&
            existingResponse.userID !== authResponse.userID) {
          FB.logout();
        }

        FB.init(newOptions);
      }
      return true;
    },
    getAuthType: function() {
      return "facebook";
    },
    deauthenticate: function() {
      this.restoreAuthentication(null);
    }
  };

  /**
   * Provides a set of utilities for using Parse with Facebook.
   * @namespace
   * Provides a set of utilities for using Parse with Facebook.
   */
  Parse.FacebookUtils = {
    /**
     * Initializes Parse Facebook integration.  Call this function after you
     * have loaded the Facebook Javascript SDK with the same parameters
     * as you would pass to<code>
     * <a href=
     * "https://developers.facebook.com/docs/reference/javascript/FB.init/">
     * FB.init()</a></code>.  Parse.FacebookUtils will invoke FB.init() for you
     * with these arguments.
     *
     * @param {Object} options Facebook options argument as described here:
     *   <a href=
     *   "https://developers.facebook.com/docs/reference/javascript/FB.init/">
     *   FB.init()</a>. The status flag will be coerced to 'false' because it
     *   interferes with Parse Facebook integration. Call FB.getLoginStatus()
     *   explicitly if this behavior is required by your application.
     */
    init: function(options) {
      if (typeof(FB) === 'undefined') {
        throw "The Facebook JavaScript SDK must be loaded before calling init.";
      } 
      initOptions = _.clone(options) || {};
      if (initOptions.status && typeof(console) !== "undefined") {
        var warn = console.warn || console.log || function() {};
        warn.call(console, "The 'status' flag passed into" +
          " FB.init, when set to true, can interfere with Parse Facebook" +
          " integration, so it has been suppressed. Please call" +
          " FB.getLoginStatus() explicitly if you require this behavior.");
      }
      initOptions.status = false;
      FB.init(initOptions);
      Parse.User._registerAuthenticationProvider(provider);
      initialized = true;
    },

    /**
     * Gets whether the user has their account linked to Facebook.
     * 
     * @param {Parse.User} user User to check for a facebook link.
     *     The user must be logged in on this device.
     * @return {Boolean} <code>true</code> if the user has their account
     *     linked to Facebook.
     */
    isLinked: function(user) {
      return user._isLinked("facebook");
    },

    /**
     * Logs in a user using Facebook. This method delegates to the Facebook
     * SDK to authenticate the user, and then automatically logs in (or
     * creates, in the case where it is a new user) a Parse.User.
     * 
     * @param {String, Object} permissions The permissions required for Facebook
     *    log in.  This is a comma-separated string of permissions.
     *    Alternatively, supply a Facebook authData object as described in our
     *    REST API docs if you want to handle getting facebook auth tokens
     *    yourself.
     * @param {Object} options Standard options object with success and error
     *    callbacks.
     */
    logIn: function(permissions, options) {
      if (!permissions || _.isString(permissions)) {
        if (!initialized) {
          throw "You must initialize FacebookUtils before calling logIn.";
        }
        requestedPermissions = permissions;
        return Parse.User._logInWith("facebook", options);
      } else {
        var newOptions = _.clone(options) || {};
        newOptions.authData = permissions;
        return Parse.User._logInWith("facebook", newOptions);
      }
    },

    /**
     * Links Facebook to an existing PFUser. This method delegates to the
     * Facebook SDK to authenticate the user, and then automatically links
     * the account to the Parse.User.
     *
     * @param {Parse.User} user User to link to Facebook. This must be the
     *     current user.
     * @param {String, Object} permissions The permissions required for Facebook
     *    log in.  This is a comma-separated string of permissions. 
     *    Alternatively, supply a Facebook authData object as described in our
     *    REST API docs if you want to handle getting facebook auth tokens
     *    yourself.
     * @param {Object} options Standard options object with success and error
     *    callbacks.
     */
    link: function(user, permissions, options) {
      if (!permissions || _.isString(permissions)) {
        if (!initialized) {
          throw "You must initialize FacebookUtils before calling link.";
        }
        requestedPermissions = permissions;
        return user._linkWith("facebook", options);
      } else {
        var newOptions = _.clone(options) || {};
        newOptions.authData = permissions;
        return user._linkWith("facebook", newOptions);
      }
    },

    /**
     * Unlinks the Parse.User from a Facebook account. 
     * 
     * @param {Parse.User} user User to unlink from Facebook. This must be the
     *     current user.
     * @param {Object} options Standard options object with success and error
     *    callbacks.
     */
    unlink: function(user, options) {
      if (!initialized) {
        throw "You must initialize FacebookUtils before calling unlink.";
      }
      return user._unlinkFrom("facebook", options);
    }
  };
  
}(this));

/*global _: false, document: false, window: false, navigator: false */
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * History serves as a global router (per frame) to handle hashchange
   * events or pushState, match the appropriate route, and trigger
   * callbacks. You shouldn't ever have to create one of these yourself
   * — you should use the reference to <code>Parse.history</code>
   * that will be created for you automatically if you make use of 
   * Routers with routes.
   * @class
   *   
   * <p>A fork of Backbone.History, provided for your convenience.  If you 
   * use this class, you must also include jQuery, or another library 
   * that provides a jQuery-compatible $ function.  For more information,
   * see the <a href="http://documentcloud.github.com/backbone/#History">
   * Backbone documentation</a>.</p>
   * <p><strong><em>Available in the client SDK only.</em></strong></p>
   */
  Parse.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');
  };

  // Cached regex for cleaning leading hashes and slashes .
  var routeStripper = /^[#\/]/;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Has the history handling already been started?
  Parse.History.started = false;

  // Set up all inheritable **Parse.History** properties and methods.
  _.extend(Parse.History.prototype, Parse.Events,
           /** @lends Parse.History.prototype */ {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(windowOverride) {
      var loc = windowOverride ? windowOverride.location : window.location;
      var match = loc.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (Parse._isNullOrUndefined(fragment)) {
        if (this._hasPushState || forcePushState) {
          fragment = window.location.pathname;
          var search = window.location.search;
          if (search) {
            fragment += search;
          }
        } else {
          fragment = this.getHash();
        }
      }
      if (!fragment.indexOf(this.options.root)) {
        fragment = fragment.substr(this.options.root.length);
      }
      return fragment.replace(routeStripper, '');
    },

    /**
     * Start the hash change handling, returning `true` if the current
     * URL matches an existing route, and `false` otherwise.
     */
    start: function(options) {
      if (Parse.History.started) {
        throw new Error("Parse.history has already been started");
      }
      Parse.History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options = _.extend({}, {root: '/'}, this.options, options);
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState = !!this.options.pushState;
      this._hasPushState = !!(this.options.pushState && 
                              window.history &&
                              window.history.pushState);
      var fragment = this.getFragment();
      var docMode = document.documentMode;
      var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) &&
                   (!docMode || docMode <= 7));

      if (oldIE) {
        this.iframe = Parse.$('<iframe src="javascript:0" tabindex="-1" />')
                      .hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Parse.$(window).bind('popstate', this.checkUrl);
      } else if (this._wantsHashChange &&
                 ('onhashchange' in window) &&
                 !oldIE) {
        Parse.$(window).bind('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = window.setInterval(this.checkUrl,
                                                    this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = window.location;
      var atRoot  = loc.pathname === this.options.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && 
          this._wantsPushState && 
          !this._hasPushState &&
          !atRoot) {
        this.fragment = this.getFragment(null, true);
        window.location.replace(this.options.root + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState &&
                 this._hasPushState && 
                 atRoot &&
                 loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        window.history.replaceState({}, document.title,
            loc.protocol + '//' + loc.host + this.options.root + this.fragment);
      }

      if (!this.options.silent) {
        return this.loadUrl();
      }
    },

    // Disable Parse.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Parse.$(window).unbind('popstate', this.checkUrl)
                     .unbind('hashchange', this.checkUrl);
      window.clearInterval(this._checkUrlInterval);
      Parse.History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) {
        return false;
      }
      if (this.iframe) {
        this.navigate(current);
      }
      if (!this.loadUrl()) {
        this.loadUrl(this.getHash());
      }
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the
    // history.
    navigate: function(fragment, options) {
      if (!Parse.History.started) {
        return false;
      }
      if (!options || options === true) {
        options = {trigger: options};
      }
      var frag = (fragment || '').replace(routeStripper, '');
      if (this.fragment === frag) {
        return;
      }

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        if (frag.indexOf(this.options.root) !== 0) {
          frag = this.options.root + frag;
        }
        this.fragment = frag;
        var replaceOrPush = options.replace ? 'replaceState' : 'pushState';
        window.history[replaceOrPush]({}, document.title, frag);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this.fragment = frag;
        this._updateHash(window.location, frag, options.replace);
        if (this.iframe &&
            (frag !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier
          // to push a history entry on hash-tag change.
          // When replace is true, we don't want this.
          if (!options.replace) {
            this.iframe.document.open().close();
          }
          this._updateHash(this.iframe.location, frag, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        window.location.assign(this.options.root + fragment);
      }
      if (options.trigger) {
        this.loadUrl(fragment);
      }
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var s = location.toString().replace(/(javascript:|#).*$/, '');
        location.replace(s + '#' + fragment);
      } else {
        location.hash = fragment;
      }
    }
  });
}(this));

/*global _: false*/
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * Routers map faux-URLs to actions, and fire events when routes are
   * matched. Creating a new one sets its `routes` hash, if not set statically.
   * @class
   *
   * <p>A fork of Backbone.Router, provided for your convenience.
   * For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#Router">Backbone
   * documentation</a>.</p>
   * <p><strong><em>Available in the client SDK only.</em></strong></p>
   */
  Parse.Router = function(options) {
    options = options || {};
    if (options.routes) {
      this.routes = options.routes;
    }
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var namedParam    = /:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-\[\]{}()+?.,\\\^\$\|#\s]/g;

  // Set up all inheritable **Parse.Router** properties and methods.
  _.extend(Parse.Router.prototype, Parse.Events,
           /** @lends Parse.Router.prototype */ {

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    /**
     * Manually bind a single named route to a callback. For example:
     *
     * <pre>this.route('search/:query/p:num', 'search', function(query, num) {
     *       ...
     *     });</pre>
     */
    route: function(route, name, callback) {
      Parse.history = Parse.history || new Parse.History();
      if (!_.isRegExp(route)) {
        route = this._routeToRegExp(route);
      } 
      if (!callback) {
        callback = this[name];
      }
      Parse.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        if (callback) {
          callback.apply(this, args);
        }
        this.trigger.apply(this, ['route:' + name].concat(args));
        Parse.history.trigger('route', this, name, args);
      }, this));
      return this;
    },

    /**
     * Whenever you reach a point in your application that you'd
     * like to save as a URL, call navigate in order to update the
     * URL. If you wish to also call the route function, set the 
     * trigger option to true. To update the URL without creating
     * an entry in the browser's history, set the replace option
     * to true.
     */
    navigate: function(fragment, options) {
      Parse.history.navigate(fragment, options);
    },

    // Bind all defined routes to `Parse.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) { 
        return;
      }
      var routes = [];
      for (var route in this.routes) {
        if (this.routes.hasOwnProperty(route)) {
          routes.unshift([route, this.routes[route]]);
        }
      }
      for (var i = 0, l = routes.length; i < l; i++) {
        this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(namedParam, '([^\/]+)')
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    }
  });

  /**
   * @function
   * @param {Object} instanceProps Instance properties for the router.
   * @param {Object} classProps Class properies for the router.
   * @return {Class} A new subclass of <code>Parse.Router</code>.
   */
  Parse.Router.extend = Parse._extend;
}(this));
(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;
  var _ = Parse._;

  /**
   * @namespace Contains functions for calling and declaring
   * <a href="/docs/cloud_code_guide#functions">cloud functions</a>.
   * <p><strong><em>
   *   Some functions are only available from Cloud Code.
   * </em></strong></p>
   */
  Parse.Cloud = Parse.Cloud || {};

  _.extend(Parse.Cloud, /** @lends Parse.Cloud */ {
    /**
     * Makes a call to a cloud function.
     * @param {String} name The function name.
     * @param {Object} data The parameters to send to the cloud function.
     * @param {Object} options A Backbone-style options object
     * options.success, if set, should be a function to handle a successful
     * call to a cloud function.  options.error should be a function that
     * handles an error running the cloud function.  Both functions are
     * optional.  Both functions take a single argument.
     * @return {Parse.Promise} A promise that will be resolved with the result
     * of the function.
     */
    run: function(name, data, options) {
      options = options || {};

      var request = Parse._request({
        route: "functions",
        className: name,
        method: 'POST',
        useMasterKey: options.useMasterKey,
        data: Parse._encode(data, null, true)
      });

      return request.then(function(resp) {
        return Parse._decode(null, resp).result;
      })._thenRunCallbacks(options);
    }
  });
}(this));

(function(root) {
  root.Parse = root.Parse || {};
  var Parse = root.Parse;

  Parse.Installation = Parse.Object.extend("_Installation");

  /**
   * Contains functions to deal with Push in Parse
   * @name Parse.Push
   * @namespace
   */
  Parse.Push = Parse.Push || {};

  /**
   * Sends a push notification.
   * @param {Object} data -  The data of the push notification.  Valid fields
   * are:
   *   <ol>
   *     <li>channels - An Array of channels to push to.</li>
   *     <li>push_time - A Date object for when to send the push.</li>
   *     <li>expiration_time -  A Date object for when to expire
   *         the push.</li>
   *     <li>expiration_interval - The seconds from now to expire the push.</li>
   *     <li>where - A Parse.Query over Parse.Installation that is used to match
   *         a set of installations to push to.</li>
   *     <li>data - The data to send as part of the push</li>
   *   <ol>
   * @param {Object} options An object that has an optional success function,
   * that takes no arguments and will be called on a successful push, and
   * an error function that takes a Parse.Error and will be called if the push
   * failed.
   */
  Parse.Push.send = function(data, options) {
    options = options || {};

    if (data.where) {
      data.where = data.where.toJSON().where;
    }

    if (data.push_time) {
      data.push_time = data.push_time.toJSON();
    }

    if (data.expiration_time) {
      data.expiration_time = data.expiration_time.toJSON();
    }

    if (data.expiration_time && data.expiration_interval) {
      throw "Both expiration_time and expiration_interval can't be set";
    }

    var request = Parse._request({
      route: 'push',
      method: 'POST',
      data: data,
      useMasterKey: options.useMasterKey
    });
    return request._thenRunCallbacks(options);
  };
}(this));
;
/*!
 * Bootstrap v3.1.1 (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */
if("undefined"==typeof $)throw new Error("Bootstrap's JavaScript requires $");+function(a){"use strict";function b(){var a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var c in b)if(void 0!==a.style[c])return{end:b[c]};return!1}a.fn.emulateTransitionEnd=function(b){var c=!1,d=this;a(this).one(a.support.transition.end,function(){c=!0});var e=function(){c||a(d).trigger(a.support.transition.end)};return setTimeout(e,b),this},a(function(){a.support.transition=b()})}($),+function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype.close=function(b){function c(){f.trigger("closed.bs.alert").remove()}var d=a(this),e=d.attr("data-target");e||(e=d.attr("href"),e=e&&e.replace(/.*(?=#[^\s]*$)/,""));var f=a(e);b&&b.preventDefault(),f.length||(f=d.hasClass("alert")?d:d.parent()),f.trigger(b=a.Event("close.bs.alert")),b.isDefaultPrevented()||(f.removeClass("in"),a.support.transition&&f.hasClass("fade")?f.one(a.support.transition.end,c).emulateTransitionEnd(150):c())};var d=a.fn.alert;a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("bs.alert");e||d.data("bs.alert",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.alert.Constructor=c,a.fn.alert.noConflict=function(){return a.fn.alert=d,this},a(document).on("click.bs.alert.data-api",b,c.prototype.close)}($),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.isLoading=!1};b.DEFAULTS={loadingText:"loading..."},b.prototype.setState=function(b){var c="disabled",d=this.$element,e=d.is("input")?"val":"html",f=d.data();b+="Text",f.resetText||d.data("resetText",d[e]()),d[e](f[b]||this.options[b]),setTimeout(a.proxy(function(){"loadingText"==b?(this.isLoading=!0,d.addClass(c).attr(c,c)):this.isLoading&&(this.isLoading=!1,d.removeClass(c).removeAttr(c))},this),0)},b.prototype.toggle=function(){var a=!0,b=this.$element.closest('[data-toggle="buttons"]');if(b.length){var c=this.$element.find("input");"radio"==c.prop("type")&&(c.prop("checked")&&this.$element.hasClass("active")?a=!1:b.find(".active").removeClass("active")),a&&c.prop("checked",!this.$element.hasClass("active")).trigger("change")}a&&this.$element.toggleClass("active")};var c=a.fn.button;a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("bs.button"),f="object"==typeof c&&c;e||d.data("bs.button",e=new b(this,f)),"toggle"==c?e.toggle():c&&e.setState(c)})},a.fn.button.Constructor=b,a.fn.button.noConflict=function(){return a.fn.button=c,this},a(document).on("click.bs.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle"),b.preventDefault()})}($),+function(a){"use strict";var b=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,this.paused=this.sliding=this.interval=this.$active=this.$items=null,"hover"==this.options.pause&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.DEFAULTS={interval:5e3,pause:"hover",wrap:!0},b.prototype.cycle=function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},b.prototype.getActiveIndex=function(){return this.$active=this.$element.find(".item.active"),this.$items=this.$active.parent().children(),this.$items.index(this.$active)},b.prototype.to=function(b){var c=this,d=this.getActiveIndex();return b>this.$items.length-1||0>b?void 0:this.sliding?this.$element.one("slid.bs.carousel",function(){c.to(b)}):d==b?this.pause().cycle():this.slide(b>d?"next":"prev",a(this.$items[b]))},b.prototype.pause=function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},b.prototype.next=function(){return this.sliding?void 0:this.slide("next")},b.prototype.prev=function(){return this.sliding?void 0:this.slide("prev")},b.prototype.slide=function(b,c){var d=this.$element.find(".item.active"),e=c||d[b](),f=this.interval,g="next"==b?"left":"right",h="next"==b?"first":"last",i=this;if(!e.length){if(!this.options.wrap)return;e=this.$element.find(".item")[h]()}if(e.hasClass("active"))return this.sliding=!1;var j=a.Event("slide.bs.carousel",{relatedTarget:e[0],direction:g});return this.$element.trigger(j),j.isDefaultPrevented()?void 0:(this.sliding=!0,f&&this.pause(),this.$indicators.length&&(this.$indicators.find(".active").removeClass("active"),this.$element.one("slid.bs.carousel",function(){var b=a(i.$indicators.children()[i.getActiveIndex()]);b&&b.addClass("active")})),a.support.transition&&this.$element.hasClass("slide")?(e.addClass(b),e[0].offsetWidth,d.addClass(g),e.addClass(g),d.one(a.support.transition.end,function(){e.removeClass([b,g].join(" ")).addClass("active"),d.removeClass(["active",g].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger("slid.bs.carousel")},0)}).emulateTransitionEnd(1e3*d.css("transition-duration").slice(0,-1))):(d.removeClass("active"),e.addClass("active"),this.sliding=!1,this.$element.trigger("slid.bs.carousel")),f&&this.cycle(),this)};var c=a.fn.carousel;a.fn.carousel=function(c){return this.each(function(){var d=a(this),e=d.data("bs.carousel"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c),g="string"==typeof c?c:f.slide;e||d.data("bs.carousel",e=new b(this,f)),"number"==typeof c?e.to(c):g?e[g]():f.interval&&e.pause().cycle()})},a.fn.carousel.Constructor=b,a.fn.carousel.noConflict=function(){return a.fn.carousel=c,this},a(document).on("click.bs.carousel.data-api","[data-slide], [data-slide-to]",function(b){var c,d=a(this),e=a(d.attr("data-target")||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,"")),f=a.extend({},e.data(),d.data()),g=d.attr("data-slide-to");g&&(f.interval=!1),e.carousel(f),(g=d.attr("data-slide-to"))&&e.data("bs.carousel").to(g),b.preventDefault()}),a(window).on("load",function(){a('[data-ride="carousel"]').each(function(){var b=a(this);b.carousel(b.data())})})}($),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.transitioning=null,this.options.parent&&(this.$parent=a(this.options.parent)),this.options.toggle&&this.toggle()};b.DEFAULTS={toggle:!0},b.prototype.dimension=function(){var a=this.$element.hasClass("width");return a?"width":"height"},b.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var b=a.Event("show.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.$parent&&this.$parent.find("> .panel > .in");if(c&&c.length){var d=c.data("bs.collapse");if(d&&d.transitioning)return;c.collapse("hide"),d||c.data("bs.collapse",null)}var e=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[e](0),this.transitioning=1;var f=function(){this.$element.removeClass("collapsing").addClass("collapse in")[e]("auto"),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return f.call(this);var g=a.camelCase(["scroll",e].join("-"));this.$element.one(a.support.transition.end,a.proxy(f,this)).emulateTransitionEnd(350)[e](this.$element[0][g])}}},b.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var b=a.Event("hide.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse").removeClass("in"),this.transitioning=1;var d=function(){this.transitioning=0,this.$element.trigger("hidden.bs.collapse").removeClass("collapsing").addClass("collapse")};return a.support.transition?void this.$element[c](0).one(a.support.transition.end,a.proxy(d,this)).emulateTransitionEnd(350):d.call(this)}}},b.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()};var c=a.fn.collapse;a.fn.collapse=function(c){return this.each(function(){var d=a(this),e=d.data("bs.collapse"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c);!e&&f.toggle&&"show"==c&&(c=!c),e||d.data("bs.collapse",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.collapse.Constructor=b,a.fn.collapse.noConflict=function(){return a.fn.collapse=c,this},a(document).on("click.bs.collapse.data-api","[data-toggle=collapse]",function(b){var c,d=a(this),e=d.attr("data-target")||b.preventDefault()||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,""),f=a(e),g=f.data("bs.collapse"),h=g?"toggle":d.data(),i=d.attr("data-parent"),j=i&&a(i);g&&g.transitioning||(j&&j.find('[data-toggle=collapse][data-parent="'+i+'"]').not(d).addClass("collapsed"),d[f.hasClass("in")?"addClass":"removeClass"]("collapsed")),f.collapse(h)})}($),+function(a){"use strict";function b(b){a(d).remove(),a(e).each(function(){var d=c(a(this)),e={relatedTarget:this};d.hasClass("open")&&(d.trigger(b=a.Event("hide.bs.dropdown",e)),b.isDefaultPrevented()||d.removeClass("open").trigger("hidden.bs.dropdown",e))})}function c(b){var c=b.attr("data-target");c||(c=b.attr("href"),c=c&&/#[A-Za-z]/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,""));var d=c&&a(c);return d&&d.length?d:b.parent()}var d=".dropdown-backdrop",e="[data-toggle=dropdown]",f=function(b){a(b).on("click.bs.dropdown",this.toggle)};f.prototype.toggle=function(d){var e=a(this);if(!e.is(".disabled, :disabled")){var f=c(e),g=f.hasClass("open");if(b(),!g){"ontouchstart"in document.documentElement&&!f.closest(".navbar-nav").length&&a('<div class="dropdown-backdrop"/>').insertAfter(a(this)).on("click",b);var h={relatedTarget:this};if(f.trigger(d=a.Event("show.bs.dropdown",h)),d.isDefaultPrevented())return;f.toggleClass("open").trigger("shown.bs.dropdown",h),e.focus()}return!1}},f.prototype.keydown=function(b){if(/(38|40|27)/.test(b.keyCode)){var d=a(this);if(b.preventDefault(),b.stopPropagation(),!d.is(".disabled, :disabled")){var f=c(d),g=f.hasClass("open");if(!g||g&&27==b.keyCode)return 27==b.which&&f.find(e).focus(),d.click();var h=" li:not(.divider):visible a",i=f.find("[role=menu]"+h+", [role=listbox]"+h);if(i.length){var j=i.index(i.filter(":focus"));38==b.keyCode&&j>0&&j--,40==b.keyCode&&j<i.length-1&&j++,~j||(j=0),i.eq(j).focus()}}}};var g=a.fn.dropdown;a.fn.dropdown=function(b){return this.each(function(){var c=a(this),d=c.data("bs.dropdown");d||c.data("bs.dropdown",d=new f(this)),"string"==typeof b&&d[b].call(c)})},a.fn.dropdown.Constructor=f,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=g,this},a(document).on("click.bs.dropdown.data-api",b).on("click.bs.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.bs.dropdown.data-api",e,f.prototype.toggle).on("keydown.bs.dropdown.data-api",e+", [role=menu], [role=listbox]",f.prototype.keydown)}($),+function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b),this.$backdrop=this.isShown=null,this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};b.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},b.prototype.toggle=function(a){return this[this.isShown?"hide":"show"](a)},b.prototype.show=function(b){var c=this,d=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(d),this.isShown||d.isDefaultPrevented()||(this.isShown=!0,this.escape(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.backdrop(function(){var d=a.support.transition&&c.$element.hasClass("fade");c.$element.parent().length||c.$element.appendTo(document.body),c.$element.show().scrollTop(0),d&&c.$element[0].offsetWidth,c.$element.addClass("in").attr("aria-hidden",!1),c.enforceFocus();var e=a.Event("shown.bs.modal",{relatedTarget:b});d?c.$element.find(".modal-dialog").one(a.support.transition.end,function(){c.$element.focus().trigger(e)}).emulateTransitionEnd(300):c.$element.focus().trigger(e)}))},b.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one(a.support.transition.end,a.proxy(this.hideModal,this)).emulateTransitionEnd(300):this.hideModal())},b.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){this.$element[0]===a.target||this.$element.has(a.target).length||this.$element.focus()},this))},b.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.bs.modal",a.proxy(function(a){27==a.which&&this.hide()},this)):this.isShown||this.$element.off("keyup.dismiss.bs.modal")},b.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden.bs.modal")})},b.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},b.prototype.backdrop=function(b){var c=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var d=a.support.transition&&c;if(this.$backdrop=a('<div class="modal-backdrop '+c+'" />').appendTo(document.body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(a){a.target===a.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus.call(this.$element[0]):this.hide.call(this))},this)),d&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;d?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()):b&&b()};var c=a.fn.modal;a.fn.modal=function(c,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},b.DEFAULTS,e.data(),"object"==typeof c&&c);f||e.data("bs.modal",f=new b(this,g)),"string"==typeof c?f[c](d):g.show&&f.show(d)})},a.fn.modal.Constructor=b,a.fn.modal.noConflict=function(){return a.fn.modal=c,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());c.is("a")&&b.preventDefault(),e.modal(f,this).one("hide",function(){c.is(":visible")&&c.focus()})}),a(document).on("show.bs.modal",".modal",function(){a(document.body).addClass("modal-open")}).on("hidden.bs.modal",".modal",function(){a(document.body).removeClass("modal-open")})}($),+function(a){"use strict";var b=function(a,b){this.type=this.options=this.enabled=this.timeout=this.hoverState=this.$element=null,this.init("tooltip",a,b)};b.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1},b.prototype.init=function(b,c,d){this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d);for(var e=this.options.trigger.split(" "),f=e.length;f--;){var g=e[f];if("click"==g)this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if("manual"!=g){var h="hover"==g?"mouseenter":"focusin",i="hover"==g?"mouseleave":"focusout";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},b.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},b.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="in",c.options.delay&&c.options.delay.show?void(c.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show)):c.show()},b.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="out",c.options.delay&&c.options.delay.hide?void(c.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide)):c.hide()},b.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){if(this.$element.trigger(b),b.isDefaultPrevented())return;var c=this,d=this.tip();this.setContent(),this.options.animation&&d.addClass("fade");var e="function"==typeof this.options.placement?this.options.placement.call(this,d[0],this.$element[0]):this.options.placement,f=/\s?auto?\s?/i,g=f.test(e);g&&(e=e.replace(f,"")||"top"),d.detach().css({top:0,left:0,display:"block"}).addClass(e),this.options.container?d.appendTo(this.options.container):d.insertAfter(this.$element);var h=this.getPosition(),i=d[0].offsetWidth,j=d[0].offsetHeight;if(g){var k=this.$element.parent(),l=e,m=document.documentElement.scrollTop||document.body.scrollTop,n="body"==this.options.container?window.innerWidth:k.outerWidth(),o="body"==this.options.container?window.innerHeight:k.outerHeight(),p="body"==this.options.container?0:k.offset().left;e="bottom"==e&&h.top+h.height+j-m>o?"top":"top"==e&&h.top-m-j<0?"bottom":"right"==e&&h.right+i>n?"left":"left"==e&&h.left-i<p?"right":e,d.removeClass(l).addClass(e)}var q=this.getCalculatedOffset(e,h,i,j);this.applyPlacement(q,e),this.hoverState=null;var r=function(){c.$element.trigger("shown.bs."+c.type)};a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,r).emulateTransitionEnd(150):r()}},b.prototype.applyPlacement=function(b,c){var d,e=this.tip(),f=e[0].offsetWidth,g=e[0].offsetHeight,h=parseInt(e.css("margin-top"),10),i=parseInt(e.css("margin-left"),10);isNaN(h)&&(h=0),isNaN(i)&&(i=0),b.top=b.top+h,b.left=b.left+i,a.offset.setOffset(e[0],a.extend({using:function(a){e.css({top:Math.round(a.top),left:Math.round(a.left)})}},b),0),e.addClass("in");var j=e[0].offsetWidth,k=e[0].offsetHeight;if("top"==c&&k!=g&&(d=!0,b.top=b.top+g-k),/bottom|top/.test(c)){var l=0;b.left<0&&(l=-2*b.left,b.left=0,e.offset(b),j=e[0].offsetWidth,k=e[0].offsetHeight),this.replaceArrow(l-f+j,j,"left")}else this.replaceArrow(k-g,k,"top");d&&e.offset(b)},b.prototype.replaceArrow=function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},b.prototype.hide=function(){function b(){"in"!=c.hoverState&&d.detach(),c.$element.trigger("hidden.bs."+c.type)}var c=this,d=this.tip(),e=a.Event("hide.bs."+this.type);return this.$element.trigger(e),e.isDefaultPrevented()?void 0:(d.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,b).emulateTransitionEnd(150):b(),this.hoverState=null,this)},b.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},b.prototype.hasContent=function(){return this.getTitle()},b.prototype.getPosition=function(){var b=this.$element[0];return a.extend({},"function"==typeof b.getBoundingClientRect?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},b.prototype.getCalculatedOffset=function(a,b,c,d){return"bottom"==a?{top:b.top+b.height,left:b.left+b.width/2-c/2}:"top"==a?{top:b.top-d,left:b.left+b.width/2-c/2}:"left"==a?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},b.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},b.prototype.tip=function(){return this.$tip=this.$tip||a(this.options.template)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},b.prototype.validate=function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},b.prototype.enable=function(){this.enabled=!0},b.prototype.disable=function(){this.enabled=!1},b.prototype.toggleEnabled=function(){this.enabled=!this.enabled},b.prototype.toggle=function(b){var c=b?a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type):this;c.tip().hasClass("in")?c.leave(c):c.enter(c)},b.prototype.destroy=function(){clearTimeout(this.timeout),this.hide().$element.off("."+this.type).removeData("bs."+this.type)};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f="object"==typeof c&&c;(e||"destroy"!=c)&&(e||d.data("bs.tooltip",e=new b(this,f)),"string"==typeof c&&e[c]())})},a.fn.tooltip.Constructor=b,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}($),+function(a){"use strict";var b=function(a,b){this.init("popover",a,b)};if(!a.fn.tooltip)throw new Error("Popover requires tooltip.js");b.DEFAULTS=a.extend({},a.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype),b.prototype.constructor=b,b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content")[this.options.html?"string"==typeof c?"html":"append":"text"](c),a.removeClass("fade top bottom left right in"),a.find(".popover-title").html()||a.find(".popover-title").hide()},b.prototype.hasContent=function(){return this.getTitle()||this.getContent()},b.prototype.getContent=function(){var a=this.$element,b=this.options;return a.attr("data-content")||("function"==typeof b.content?b.content.call(a[0]):b.content)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")},b.prototype.tip=function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip};var c=a.fn.popover;a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("bs.popover"),f="object"==typeof c&&c;(e||"destroy"!=c)&&(e||d.data("bs.popover",e=new b(this,f)),"string"==typeof c&&e[c]())})},a.fn.popover.Constructor=b,a.fn.popover.noConflict=function(){return a.fn.popover=c,this}}($),+function(a){"use strict";function b(c,d){var e,f=a.proxy(this.process,this);this.$element=a(a(c).is("body")?window:c),this.$body=a("body"),this.$scrollElement=this.$element.on("scroll.bs.scroll-spy.data-api",f),this.options=a.extend({},b.DEFAULTS,d),this.selector=(this.options.target||(e=a(c).attr("href"))&&e.replace(/.*(?=#[^\s]+$)/,"")||"")+" .nav li > a",this.offsets=a([]),this.targets=a([]),this.activeTarget=null,this.refresh(),this.process()}b.DEFAULTS={offset:10},b.prototype.refresh=function(){var b=this.$element[0]==window?"offset":"position";this.offsets=a([]),this.targets=a([]);{var c=this;this.$body.find(this.selector).map(function(){var d=a(this),e=d.data("target")||d.attr("href"),f=/^#./.test(e)&&a(e);return f&&f.length&&f.is(":visible")&&[[f[b]().top+(!a.isWindow(c.$scrollElement.get(0))&&c.$scrollElement.scrollTop()),e]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){c.offsets.push(this[0]),c.targets.push(this[1])})}},b.prototype.process=function(){var a,b=this.$scrollElement.scrollTop()+this.options.offset,c=this.$scrollElement[0].scrollHeight||this.$body[0].scrollHeight,d=c-this.$scrollElement.height(),e=this.offsets,f=this.targets,g=this.activeTarget;if(b>=d)return g!=(a=f.last()[0])&&this.activate(a);if(g&&b<=e[0])return g!=(a=f[0])&&this.activate(a);for(a=e.length;a--;)g!=f[a]&&b>=e[a]&&(!e[a+1]||b<=e[a+1])&&this.activate(f[a])},b.prototype.activate=function(b){this.activeTarget=b,a(this.selector).parentsUntil(this.options.target,".active").removeClass("active");var c=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',d=a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length&&(d=d.closest("li.dropdown").addClass("active")),d.trigger("activate.bs.scrollspy")};var c=a.fn.scrollspy;a.fn.scrollspy=function(c){return this.each(function(){var d=a(this),e=d.data("bs.scrollspy"),f="object"==typeof c&&c;e||d.data("bs.scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.scrollspy.Constructor=b,a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=c,this},a(window).on("load",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);b.scrollspy(b.data())})})}($),+function(a){"use strict";var b=function(b){this.element=a(b)};b.prototype.show=function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.data("target");if(d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),!b.parent("li").hasClass("active")){var e=c.find(".active:last a")[0],f=a.Event("show.bs.tab",{relatedTarget:e});if(b.trigger(f),!f.isDefaultPrevented()){var g=a(d);this.activate(b.parent("li"),c),this.activate(g,g.parent(),function(){b.trigger({type:"shown.bs.tab",relatedTarget:e})})}}},b.prototype.activate=function(b,c,d){function e(){f.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"),b.addClass("active"),g?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active"),d&&d()}var f=c.find("> .active"),g=d&&a.support.transition&&f.hasClass("fade");g?f.one(a.support.transition.end,e).emulateTransitionEnd(150):e(),f.removeClass("in")};var c=a.fn.tab;a.fn.tab=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tab");e||d.data("bs.tab",e=new b(this)),"string"==typeof c&&e[c]()})},a.fn.tab.Constructor=b,a.fn.tab.noConflict=function(){return a.fn.tab=c,this},a(document).on("click.bs.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(b){b.preventDefault(),a(this).tab("show")})}($),+function(a){"use strict";var b=function(c,d){this.options=a.extend({},b.DEFAULTS,d),this.$window=a(window).on("scroll.bs.affix.data-api",a.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",a.proxy(this.checkPositionWithEventLoop,this)),this.$element=a(c),this.affixed=this.unpin=this.pinnedOffset=null,this.checkPosition()};b.RESET="affix affix-top affix-bottom",b.DEFAULTS={offset:0},b.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset;this.$element.removeClass(b.RESET).addClass("affix");var a=this.$window.scrollTop(),c=this.$element.offset();return this.pinnedOffset=c.top-a},b.prototype.checkPositionWithEventLoop=function(){setTimeout(a.proxy(this.checkPosition,this),1)},b.prototype.checkPosition=function(){if(this.$element.is(":visible")){var c=a(document).height(),d=this.$window.scrollTop(),e=this.$element.offset(),f=this.options.offset,g=f.top,h=f.bottom;"top"==this.affixed&&(e.top+=d),"object"!=typeof f&&(h=g=f),"function"==typeof g&&(g=f.top(this.$element)),"function"==typeof h&&(h=f.bottom(this.$element));var i=null!=this.unpin&&d+this.unpin<=e.top?!1:null!=h&&e.top+this.$element.height()>=c-h?"bottom":null!=g&&g>=d?"top":!1;if(this.affixed!==i){this.unpin&&this.$element.css("top","");var j="affix"+(i?"-"+i:""),k=a.Event(j+".bs.affix");this.$element.trigger(k),k.isDefaultPrevented()||(this.affixed=i,this.unpin="bottom"==i?this.getPinnedOffset():null,this.$element.removeClass(b.RESET).addClass(j).trigger(a.Event(j.replace("affix","affixed"))),"bottom"==i&&this.$element.offset({top:c-h-this.$element.height()}))}}};var c=a.fn.affix;a.fn.affix=function(c){return this.each(function(){var d=a(this),e=d.data("bs.affix"),f="object"==typeof c&&c;e||d.data("bs.affix",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.affix.Constructor=b,a.fn.affix.noConflict=function(){return a.fn.affix=c,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var b=a(this),c=b.data();c.offset=c.offset||{},c.offsetBottom&&(c.offset.bottom=c.offsetBottom),c.offsetTop&&(c.offset.top=c.offsetTop),b.affix(c)})})}($);;
$.fn.serializeObject = function() {
    var o = Object.create(null),
        elementMapper = function(element) {
            element.name = $.camelCase(element.name);
            return element;
        },
        appendToResult = function(i, element) {
            var node = o[element.name];

            if ('undefined' !== typeof node && node !== null) {
                o[element.name] = node.push ? node.push(element.value) : [node, element.value];
            } else {
                o[element.name] = element.value;
            }
        };

    $.each($.map(this.serializeArray(), elementMapper), appendToResult);
    return o;
};

$(function() {

    Parse.initialize("Vd1Qs3EyW8r7JebCa7n9X6WXjvMxa711HJfKvWqJ", "q8fq25b1iNZyzyRqdIZHpXQKY5R4mTWU1QLeA374");

    // Trip Object
    // -----------------
    var Trip = Parse.Object.extend("Trip", {
        // Default attributes
        defaults: {
            title: "New Trip",
            date: new Date(),
            startOdometer: 0,
            endOdometer: 0
        },

        // Ensure that each trip created has date and title.
        initialize: function() {
            if (!this.get("title")) {
                this.set(this.defaults.title);
            }
            if (!this.get("date")) {
                this.set(this.defaults.date);
            }
        }
    });


    // Trips Collection
    // ---------------
    var TripsList = Parse.Collection.extend({

        // Reference to this collection's model.
        model: Trip,

        // Trips are sorted by date
        comparator: function(trip) {
            return -trip.get('date');
        },

        initialize: function() {
            this.on('change:date', function() { this.sort() }, this);
            this.on('destroy', function() { this.sort() }, this);
            this.on('add', function() { this.sort() }, this);
        }
    });

    // View Objects
    // -----------------
    var LogInView = Parse.View.extend({
        events: {
            "click .btn.login": "logIn",
            "click .btn.signup": "signUp"
        },

        el: ".container",

        initialize: function() {
            _.bindAll(this, "logIn", "signUp", 'render');
            this.render();
        },

        logIn: function(e) {
            e.preventDefault();
            var self = this;
            var username = this.$("#login-username").val();
            var password = this.$("#login-password").val();

            Parse.User.logIn(username, password, {
                success: function(user) {
                    new ManageTripsView();
                    self.undelegateEvents();
                    self = null;
                },

                error: function(user, error) {
                    self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
                    self.$(".login-form button").removeAttr("disabled");
                }
            });
        },

        signUp: function(e) {
            e.preventDefault();
            var self = this;
            var username = this.$("#signup-username").val();
            var password = this.$("#signup-password").val();

            Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
                success: function(user) {
                    new ManageTripsView();
                    self.undelegateEvents();
                    self = null;
                },

                error: function(user, error) {
                    self.$(".signup-form .error").html(error.message).show();
                    self.$(".signup-form button").removeAttr("disabled");
                }
            });

            this.$(".signup-form button").attr("disabled", "disabled");

            return false;
        },

        render: function() {
            this.$el.html(_.template($("#login-template").html()));
            this.delegateEvents();
        }
    });

    var TripView = Parse.View.extend({

        tagName:  "tr",

        // Cache the template function for a single item.
        template: _.template($('#trip-template').html()),

        events: {
            "click .edit-me"    : "edit",
            "click .delete-me"  : "delete",
            "click .save"       : "save",
            "click .cancel"     : "cancel",
            "keypress .editing" : "updateOnEnter"
        },

        initialize: function() {
            _.bindAll(this, 'render', 'cancel', 'delete', 'save', 'edit', 'updateOnEnter');
            this.model.bind('save', this.render);
            this.model.bind('delete', this.remove);
        },

        // Re-render the contents of the trip item.
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            $(this.el).attr("id", this.model.cid);
            return this;
        },

        // Switch this view into editing
        edit: function() {
            $(this.el).addClass("editing");
//            this.input.focus();
        },

        // Close the editing mode, saving changes to the trip.
        save: function() {
            var elm =  $(this.el);
            // reset potential messages etc
            $(this.el).removeClass("saveme");
            $("div.alert-warning.savefirst").addClass("hidden");

            $(this.el).find(".fa-check-circle").addClass("fa-spin");
            $(this.el).find(".fa-check-circle").addClass("fa-spinner");
            $(this.el).find(".fa-check-circle").removeClass("fa-check-circle");

            var data = $(this.el).find("form").serializeObject();
            data.date = new Date(data.date);
            data.startOdometer = parseInt(data.startOdometer);
            data.endOdometer = parseInt(data.endOdometer);
            data.user = Parse.User.current();
            this.model.setACL(new Parse.ACL(Parse.User.current()));
            this.model.save(data, {
                success: function(trip) {
                    $("tbody#trips-list tr").first().removeClass("editing");
                    elm.find(".fa-spinner").addClass("fa-check-circle");
                    elm.find(".fa-spinner").removeClass("fa-spin");
                    elm.find(".fa-spinner").removeClass("fa-spinner");
                },
                error: function(trip, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and description.
                    alert('Failed to create new object, with error code: ' + error.description);
                }
            });

        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode === 13) this.save();
        },

        // Remove the item, destroy the model.
        delete: function() {
            this.model.destroy();
        },

        // Close the editing mode without changes to the trip.
        cancel: function() {
            $(this.el).removeClass("editing");
            $('#new-trip').html("");
            $('#new-table').hide();
        }
    });

    var ManageTripsView = Parse.View.extend({

        queryCount: 0,
        queryLimit: 20,
        querySkip: 0,
        pages: 1,
        currentPage: 1,

        events: {
            "click .new": "newTrip",
            "click .log-out": "logOut",
            "click a.pagination": "goToPage"
        },

        el: $(".container"),

        initialize: function() {
            var self = this;

            _.bindAll(this, 'addOne', 'addAll', 'render', 'logOut', 'goToPage');

            // Main trip management template
            this.template = _.template($("#manage-trips-template").html());
            this.$el.html(this.template);

            this.allCheckbox = this.$("#toggle-all")[0];

            // Create our collection of Todos
            this.trips = new TripsList();

            // Setup the query for the collection
            this.trips.query = new Parse.Query(Trip);
            this.trips.query.equalTo("user", Parse.User.current());
            this.trips.query.descending("date");

            this.trips.query.count({
                success: function(count) {
                    self.queryCount = count;
                    self.paginationAndFetch();
                },
                error: function(error) {
                    // if there's an error, it's likely because Parse times out when over 1000...
                    self.queryCount = 1000;
                    self.paginationAndFetch();
                }
            });

            this.trips.bind('add',     this.addOne);
            this.trips.bind('reset',   this.addAll);
            this.trips.bind('all',     this.render);

            // set the header user info
            $("ul.nav.navbar-right").html('<li><div class="user pull-left">Hi, ' + Parse.User.current().get("username") + '</div><a href="#" class="log-out pull-right">(Log out)</a></li>');

            state.on("change", this.filter, this);

            $(".log-out").on('click', function () {
                Parse.User.logOut();
                App.render();
                // change the header user info
                $("ul.nav.navbar-right").html('<li><a href="/" class="log-in">Log In</a></li>');
            });
        },

        render: function() {
//            var done = this.trips.done().length;
//            var remaining = this.trips.remaining().length;

//            this.$('#trips-stats').html(this.statsTemplate({
//                total:      this.todos.length,
//                done:       done,
//                remaining:  remaining
//            }));

//            this.delegateEvents();
//
//            this.allCheckbox.checked = !remaining;
        },

        paginationAndFetch: function () {
            this.trips.query.skip(this.querySkip);
            this.trips.query.limit(this.queryLimit);

            this.pages = Math.ceil(this.queryCount / this.queryLimit);
            this.currentPage = (this.queryLimit - this.querySkip) / this.queryLimit;
            // pagination template
            this.paginationTemplate = _.template($("#pagination-template").html());
            this.$el.find("ul.pagination").html(this.paginationTemplate({ currentPage: this.currentPage, range: _.range( 1, this.pages + 1 ) }));

            $("a.paginate").on('click', this.goToPage);
            // Fetch all the trips for this user
            this.trips.fetch();
        },

        newTrip: function( e ) {

            var _openTrip = {},
                _t = null;

            if ( this.trips.some( function (trip) {
                if ( trip.isNew() ) {
                    _openTrip = trip;
                    return true;
                }
            }) ) {

                var _elm = $(this.el).find("tr#" + _openTrip.cid);
                _elm.addClass("saveme");
                $("div.alert-warning.savefirst").removeClass("hidden");

                var _reset = function () {
                    _elm.removeClass("saveme");
                    _elm = null;
                };
                _t = setTimeout(_reset, 2000);

            } else {
                var trip = new Trip();
                this.trips.add(trip);
            }
        },

        addOne: function(trip) {
            var view = new TripView({model: trip});
            // render trip if not already fired by other event  TODO: this is heavy, must update
            if ( $("#trips-list tr#" + trip.cid).length === 0 ) {
                $("#trips-list").append(view.render().el);
                if ( trip.isNew() ) {
                    $(view.$el).addClass("editing");
                }
            }
        },

        addAll: function(collection, filter) {
            $("#trips-list").html("");
            $('#progress-bar').remove();
            this.template.pages = this.pages;
            this.template.currentPage = this.currentPage;
            this.trips.forEach(this.addOne);
        },

        logOut: function(e) {
            Parse.User.logOut();
            new LogInView();
            this.undelegateEvents();
        },

        goToPage: function (e) {
            e.preventDefault();
            var pageNum = e.target.text;

            this.querySkip = (pageNum - 1) * this.queryLimit;
            this.currentPage = pageNum;
            this.paginationAndFetch();
        }

    });

    // The Application
    // ---------------

    var AppState = Parse.Object.extend("AppState", {
        defaults: {
            filter: "all"
        }
    });

    var AppView = Parse.View.extend({

        el: $("#triptraxapp"),

        initialize: function() {
            this.render();
        },

        render: function() {
            if ( Parse.User.current() ) {
                new ManageTripsView();
            } else {
                new LogInView();
            }
        }
    });

    var state = new AppState();

    var App = new AppView();
});

// Formatters
_.template.formatdate = function (stamp) {
    var d = new Date(stamp.iso);
    return d.toLocaleDateString();
};

_.template.formatdatevalue = function (stamp) {
    var fragments = stamp.iso.split("T");
    return fragments[0];
};

