/**
 *  atta(b completion)
 *  usage:
 *      $(selector).atta({
 *        completions: function () { return ['Foo', 'Bar', 'Baz' ] }
 *      })
 */
(function ($) {
  'use strict';
  var defaults = {
      // list of completion objects to match against
      completions: function() {
          return $(".event-attendees h5 a").
              map(function (i, a) { return a.text; }).sort();
      },
      // matcher function which given a text query, should
      // return a function that takes an index i and element e (completion object)
      // which returns true when matched.
      matcher: function(query) {
          return function(i, e) {
              return e.toLowerCase().indexOf(query.toLowerCase()) != -1;
          };
      },
      at : {
          is: function(e){
              return  String.fromCharCode(e.which || e.keyCode) === "2" && e.shiftKey;
          }
          , character : '@'
      }
  };

  var Selectors = {
      container: '#atta-list-container',
      selected :'.sel',
      style: '#atta-style'
  };

  window['atta'] = {};

  /**
   * options is an object which may contain one of:
   * completions - a function which returns a list of completion options
   * at - an object representing the at trigger for tab completion.
   *      this object should contain a function, 'is', which should accept a key event
   *      and return true if the key event matches the trigger
   *      and a 'character' property which represents the display of the trigger.
   */
  $.fn.atta = function(options) {
     var self = this
      , options = options || {}
      , keys = {
          'up': 38
          , 'down': 40
          , 'escape': 27
          , 'enter': 13
          , 'tab': 9
          , 'delete': 8
      }
      , styles = [
          Selectors.container + ' { position:relative; top: -30px; left: 5px; }'
          , '#atta-list { position:relative;margin-top:18px;background:#fff;border-radius:3px;border:1px solid #ddd;box-shadow:0 0 5px rgba(0,0,0,0.1);min-width:180px;}'
          , '#atta-list ul { list-style:none;margin:0;padding:0; }'
          , '#atta-list li { padding:5px 10px;font-weight:bold;border-bottom:1px solid #eee; color:#333; }'
          , '#atta-list li' + Selectors.selected + ' { background:#1DCAFF; color:#fff; }' ]
      , completions = options.completions || defaults.completions
      , at = options.at || defaults.at
      , matcher = options.matcher || defaults.matcher
      , newList = function () {
          return $("<div id='"+Selectors.container.slice(1)+"'><div id='atta-list'><ul></ul></div></div>");
      }
      , newItem = function (name, i) {
          return '<li data-index="i' + i + '" data-name="' + name + '" ' + (i ? '' : 'class="sel"') +'>' + name + '</li>';
      }      
      , key = function(e, alias) {
          return (e.which || e.keyCode) === keys[alias];
      }
      , cancelKey = function (e) { return key(e, 'escape'); }
      , acceptKey = function (e) { return key(e, 'enter') || key(e, 'tab'); }
      , upKey = function (e) { return key(e, 'up'); }
      , downKey = function (e) { return key(e, 'down'); }
      , tabKey = function (e) { return key(e, 'tab'); }
      , deleteKey = function(e) { return key(e, 'delete'); }
      , buildMarkup = function (cs) {
          var current = $(Selectors.container)
          , markup = current.length > 0 && current || newList()
          , ul = markup.find('ul')
          , buff = [];
          for(var i = 0, l = cs.length;i < l;i++) {
              buff.push(newItem(cs[i], i));
          }
          ul.empty().append(buff.join(''));
          return markup;
      }
      , cancel = function() {
          $(Selectors.container).remove();
      }
      , showCompletions = function (ta, cs) {
          $(ta).parent().append(buildMarkup(cs));
      }
      , navigationBound = false // todo better way to detect this
      , currentSelection = function(){
          return $('#atta-list ' + Selectors.selected);
      }
      , navKey = function(e) {
          return upKey(e) || downKey(e);
      }
      , bindNavigation = function() {
          navigationBound = true;
          $(window).on('keyup', function (e) {
              var sel = currentSelection()
              , kids = $(sel.parent()).children()
              , cnt = kids.length
              , index = sel.length > 0 && parseInt(sel.data().index.slice(1), 10) || 0;
              if (cnt > -1) {
                  var selCls = Selectors.selected.slice(1)
                  , select = function(el) {
                      el.addClass(selCls);
                  }
                  , unselect = function(el) {
                      el.removeClass(selCls);
                  };
                  if (upKey(e)) {
                      e.preventDefault();
                      unselect(sel);
                      if (index > 0) {
                          select($(kids[index-1]));
                      } else if (index == 0) {
                          select($(kids[cnt-1]));
                      }
                      return false;
                  } else if (downKey(e)) {
                      e.preventDefault();
                      unselect(sel);
                      if (index < cnt-1) {
                          select($(kids[index+1]));
                      } else if (index == cnt-1) {
                          select($(kids[0]));
                      }
                      return false;
                  }
              }
              return true;
          });
      }
      , choose = function(e) {
        var target = $(window.atta._target);
        if (target) {
          var container = $(Selectors.container);
          if (container.length > 0) {
            e.preventDefault();
            var name = container.find(Selectors.selected).data().name;
            if (name.length > 0) {
              var prev = target.val()
              , next = prev.slice(0, prev.lastIndexOf(at.character) + 1) + name + ' ';
              target.val(next);
              cancel();
            }
            return false;
          }
        }
        return true;
      }
      , bindMouseSelection = function() {
        var l = $('#atta-list li')
          , selCls = Selectors.selected.slice(1)
          , select = function(el) {
              el.addClass(selCls);
          }
          , unselect = function(el) {
              el.removeClass(selCls);
          };
        if (l.length > 0) {
          l.on('mouseenter', function(e) {
            var selected = currentSelection();
            if (selected.length > 0) {
              unselect(selected);
              select($(this));
            }
         }).on('click', function(e) {
            return choose(e);
         });
        }
      };

      // append atta styles only once
      if ($(Selectors.style).length < 1) {
          $('head').append('<style type="text/css" id="'+Selectors.style.slice(1)+'">' +
                           styles.join('') +
                           '</style>');
      }

      // bind one accept and cancelation listener
      $(window).on('keydown', function(e) {
          if (cancelKey(e)) {
              cancel();
          } else if (acceptKey(e)) {
              return choose(e);
          }
          return true;
      });

      // bind query listener
      return self.each(function() {
          var listen = function (e) {
              var el = $(e.target);
              if (at.is(e)) {
                  window.atta._last_at = el.val().lastIndexOf(at.character);
                  showCompletions(e.target, completions() || []);
                  if (!navigationBound) {
                      bindNavigation();
                  }
                  bindMouseSelection();
              } else if (!acceptKey(e) && !navKey(e)) {
                  var container = $(Selectors.container);
                  if (container.length > 0) {
                      var txt = el.val(), query, matching;
                      if (txt.length > 0) {
                          var lastAt = txt.lastIndexOf(at.character);
                          if (lastAt != -1) {
                              query = txt.slice(lastAt + 1, txt.length);
                              showCompletions(el, (completions() || []).filter(matcher(query)));
                              bindMouseSelection();
                          }
                      }
                  }
                  if(deleteKey(e)) {
                      if (window.atta._last_at >= el.val().length) {
                          cancel();
                      }
                  }
              }
          }
          , self = $(this);
          self.focus(function() {
              // always maintain a handle on the last selected atta item
              window.atta._target = self;
              self.on('keyup', listen);
          }).blur(function() {
              self.unbind('keyup', listen);
              // give some time for the accept code
              // to get a handle on the selection
              setTimeout(cancel, 400);
          });
      });
  };
})(jQuery);