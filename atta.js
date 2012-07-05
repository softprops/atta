// http://www.quirksmode.org/js/keys.html
/**
 * atta(b completion)
 * usage:
 *   $(selector).atta({
 *      completions: function () { return ['Foo', 'Bar', 'Baz' ] }
 *   })
 */
function ($) {
  'use strict';
  var defaults = {
      completions: function() {
          return $("#rsvp-list a.mem-name").
              map(function (i, a) { return a.text; }).sort();
      },
      at : {
          is: function(e){
              return  String.fromCharCode(e.which || e.keyCode) === "2" && e.shiftKey
          }
          , char : '@'
      }
  };
  /**
   * options is an object which may contain one of:
   * completions - a function which returns a list of completion options
   * at - an object representing the at trigger for tab completion.
   *      this object should contain a function, 'is', which should accept a key event
   *      and return true if the key event matches the trigger
   *      and a 'char' property which represents the display of the trigger.
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
      }
      , styles = [
          '#atta-list-container { position:relative; top: 0px; left: 5px; }'
          , '#atta-list { position:relative;margin-top:18px;background:#fff;border-radius:3px;border:1px solid #ddd;box-shadow:0 0 5px rgba(0,0,0,0.1);min-width:180px;}'
          , '#atta-list ul { list-style:none;margin:0;padding:0; }'
          , '#atta-list li { padding:5px 10px;font-weight:bold;border-bottom:1px solid #eee; color:#333; }'
          , '#atta-list li.sel { background:#1DCAFF; color:#fff; }' ]
      , completions = options.completions || defaults.completions
      , at = options.at || defaults.at
      , newList = function () {
          return $("<div id='atta-list-container'><div id='atta-list'><ul></ul></div></div>");
      }
      , newItem = function (name, i) {
          return '<li data-index="' + i + '" data-name="' + name + '" class="' + (i ? '' : 'sel') +'">' +
              name + '</li>';
      }      
      , key = function(e, alias) {
          return (e.which || e.keyCode) === keys[alias];
      }
      , cancelKey = function (e) { return key(e, 'escape'); }
      , acceptKey = function (e) { return key(e, 'enter') || key(e, 'tab'); }
      , upKey = function (e) { return key(e, 'up'); }
      , downKey = function (e) { return key(e, 'down'); }
      , tabKey = function (e) { return key(e, 'tab'); }
      , buildMarkup = function (cs) {
          var current = $("#atta-list-container")
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
          $('#atta-list-container').remove();
      }
      , showCompletions = function (ta, cs) {
          var markup = buildMarkup(cs);
          $(ta).parent().append(markup);
      }
      , navigationBound = false // todo better way to detect this
      , bindNavigation = function() {
          navigationBound = true
          $(window).on('keyup', function (e) {
              var sel = $("#atta-list li.sel")
              , kids = $(sel.parent()).children()
              , cnt = kids.length
              , index = sel.length > 0 && sel.data().index || 0;
              if (cnt) {      
                  if (upKey(e)) {
                      e.preventDefault();
                      sel.removeClass('sel');
                      if (index > 0) {
                          $(kids[index-1]).addClass('sel')
                      } else if (index == 0) {
                          $(kids[cnt-1]).addClass('sel')
                      }
                      return false;
                  } else if (downKey(e)) {
                      e.preventDefault();
                      sel.removeClass('sel');
                      if (index < cnt-1) {
                          $(kids[index+1]).addClass('sel')
                      } else if (index == cnt-1) {
                          $(kids[0]).addClass('sel')
                      }
                      return false;
                  }
              }
          });
      };

      // append atta styles only once
      if ($('#atta-style').length < 1) {
          $('head').append('<style type="text/css" id="atta-style">' +
                           styles.join('') +
                           '</style>')
      }

      // bind accept and cancelation listener
      $(window).on('keyup', function(e) {
          if (cancelKey(e)) {
              cancel();
          } else if (acceptKey(e)) {
              var container = $('#atta-list-container');
              if (container.length > 0) {
                  e.preventDefault();
                  var focused = $("*:focus");
                  console.log(focused);
                  var name = container.find('.sel').text();
                  console.log('select ' + name);
                  cancel();
                  return false;
              }
          }
      });

      // bind query listener
      return self.each(function() {          
          $(this).live('keyup', function (e) {
              var el = $(e.target);
              if (at.is(e)) {
                  showCompletions(e.target, completions() || []);
                  if (!navigationBound) {
                      bindNavigation();
                  }
              } else {
                  var container = $("#atta-list-container");
                  if (container.length > 0) {
                      var txt = el.val(), query, matching, filteredCompletions;
                      if (txt.length > 0) {
                          var lastAt = txt.lastIndexOf(at.char);
                          if (lastAt != -1) {
                              query = txt.slice(lastAt + 1, txt.length);
                              matching = function(i, e) {
                                  return e.toLowerCase().indexOf(query.toLowerCase()) != -1;
                              }
                              filteredCompletions = (completions() || []).filter(matching);
                              showCompletions(el, filteredCompletions);
                          }
                      }
                  }  
              }
          });
      });
  };
)(jQuery);