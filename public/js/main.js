$(document).ready(function(e) {
  var url = window.location.origin + "/campgrounds/toprated";
  // alert(url);
  $.ajax({
    type: 'GET',
    url: url,
    success: function(res) {
      $('#rated-panel').html(res);
    }
  });
});

sr.reveal('#rated-panel', {
  duration: 1000,
  origin: 'right',
  distance: '50px',
  viewFactor: 0.1
});

sr.reveal('#campground-grid', {
  duration: 1000,
  origin: 'bottom',
  distance: '25px',
  viewFactor: 0.1
});

(function($) {
  var element = $('.follow-scroll'),
      originalY = element.offset().top;

  // Space between element and top of screen (when scrolling)
  var topMargin = 75;
  var height = document.documentElement.clientHeight;
  // Should probably be set in CSS; but here just for emphasis
  element.css('top', (height - originalY - topMargin));
  element.hide();

  $(window).on('scroll', function(event) {
      var scrollTop = $(window).scrollTop();

      if (scrollTop > 0) {
        element.show();
      } else if (scrollTop <= 0) {
        element.hide();
      }

      element.stop(false, false).animate({
      top: scrollTop < originalY
              ? height - originalY - topMargin
              : scrollTop - originalY + height - topMargin
      }, 300);
  });

  $('.follow-scroll a').bind('click', function(event) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top - 50)
    }, 1250, 'easeInOutExpo');
    event.preventDefault();
  });
})(jQuery);
