// http://www.quirksmode.org/js/keys.html
function ($) {
  'use strict';
  var defaults = {
      completions: function() {
          return $("#rsvp-list a.mem-name").
              map(function (i, a) { return a.text; }).sort();
      }
  };
  /**
   * options is an object which may contain one of
   * completions - a function which returns a list of completion options
   */
  $.fn.atta = function(options) {
     var self = this
      , options = options || {}
      , keys = {
          'up':38
          , 'down':40
          , 'escape':27
          , 'enter': 13
      }
      , styles = [
          '#atta-list-container { position:relative; top: 0px; left: 5px; }'
          , '#atta-list { position:relative;margin-top:18px;background:#fff;border-radius:3px;border:1px solid #ddd;box-shadow:0 0 5px rgba(0,0,0,0.1);min-width:180px;}'
          , '#atta-list ul { list-style:none;margin:0;padding:0; }'
          , '#atta-list li { padding:5px 10px;font-weight:bold;border-bottom:1px solid #eee; color:#333; }'
          , '#atta-list li.sel { background:#1DCAFF; color:#fff; }' ]
      , completions = options.completions || defaults.completions
      , newList = function (ta) {
          return $("<div id='atta-list-container'><div id='atta-list'><ul></ul></div></div>");
      }
      , newItem = function (name, i) {
          return '<li data-index="' + i + '" data-name="' + name + '" class="' + (i ? '' : 'sel') +'">' +
              name + '</li>';
      }
      , at = function (e) {
          return String.fromCharCode(e.which || e.keyCode) === "2" && e.shiftKey;
      }
      , key = function(e, alias) {
          return (e.which || e.keyCode) === keys[alias];
      }
      , cancelKey = function (e) { return key(e, 'escape'); }
      , acceptKey = function (e) { return key(e, 'enter'); }
      , upKey = function (e) { return key(e, 'up'); }
      , downKey = function (e) { return key(e, 'down'); } 
      , showOptions = function (ta) {
          var current = $("#atta-list-container")
          , markup = current.length > 0 && current || newList(ta)
          , cs = (completions() || [])
          , buff = [];
          for(var i = 0, l = cs.length;i < l;i++) {
              buff.push(newItem(cs[i], i));
          }
          var l = markup.find('ul')
          l.empty().append(buff.join(''));
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
          $(ta).parent().append(markup);
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
              $('#atta-list-container').remove();
          } else if (acceptKey(e)) {
              var container = $('#atta-list-container');
              if (container.length > 0) {
                  e.preventDefault();
                  var name = container.find('.sel').text();
                  console.log('select ' + name);
                  return false;
              }
          }
      });

      // bind query listener
      return self.each(function() {          
          $(this).live('keyup', function (e) {
              var el = $(e.target);
              if (at(e)) {
                  showOptions(e.target);
              } else {
                  var container = $("#atta-list-container");
                  if (container.length > 0) {
                      var txt = el.val(), query, matching, filteredNames;
                      if (txt.length > 0) {
                          var lastAt = txt.lastIndexOf('@');
                          if (lastAt != -1) {
                              query = txt.slice(lastAt + 1, txt.length);
                              matching = function(i, e) {
                                  return e.toLowerCase().indexOf(query.toLowerCase()) != -1;
                              }
                              filteredCompletions = (completions() || []).filter(matching);
                              console.log('filtered names matching ' + query);
                              console.log(filteredCompletions);
                          }
                      }
                  }  
              }
          });
      });
  };
)(jQuery);