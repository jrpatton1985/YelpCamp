$(document).ready(function() {
  $(document).on('click', '#upModal', function(e) {
    e.preventDefault();
    var url = window.location.href + "/uploads";
    //alert(url);
    $.ajax({
      type: 'GET',
      url: url,
      success: function(res) {
        $('#uploadModal').html(res);
        $('#uploadModal').modal('show');
      }
    });
  });

  $(document).on('click', '#upBtn', function(e) {
      e.preventDefault();
      $('#upload-input').click();
      $('.progress-bar').text('0%');
      $('.progress-bar').width('0%');
  });

  $(document).on('change', '#upload-input', function(e) {
    var files = $(this).get(0).files;

    if (files.length > 0) {
        // One or more files selected, process the file upload

        // create a FormData object which will be sent as the
        // data payload in the AJAX request
        var formData = new FormData();

        // loop through all the selected files
        for (var i = 0; i < files.length; i++) {
          var file = files[i];

          // add the files to formData object for the data payload
          formData.append('uploads', file, file.name);
        }

        var url = window.location.href + '/uploads';

        $.ajax({
          url: url,
          type: 'POST',
          data: formData,
          processData: false,
          contentType: false,
          success: function(data) {
              console.log('upload successful!\n' + data);
              // set the new avatar image source
              //$('#avatar').attr('src', data);
              // close the modal
              //$('#uploadModal').modal('hide');
          },

          xhr: function() {
            // create an XMLHttpRequest
            var xhr = new XMLHttpRequest();

            // listen to the 'progress' event
            xhr.upload.addEventListener('progress', function(evt) {

                if (evt.lengthComputable) {
                  // calculate the percentage of upload completed
                  var percentComplete = evt.loaded / evt.total;
                  percentComplete = parseInt(percentComplete * 100);

                  // update the Bootstrap progress bar with the
                  // new percentage
                  $('.progress-bar').text(percentComplete + '%');
                  $('.progress-bar').width(percentComplete + '%');

                  // once the upload reaches 100%, set the progress
                  // text to done
                  if (percentComplete === 100) {
                    $('.progress-bar').html('Done');

                    // set the new avatar image source
                    $('#avatar').attr('src', data);
                    // close the modal
                    $('#uploadModal').modal('hide');
                  }
                }

            }, false);

            return xhr;
          }
        });
    }
  });
});
