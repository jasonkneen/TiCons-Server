$(document).ready(function() {

  $('.outputs').on('change', function() {

    if (!$(this).is(':checked')) {
      return;
    }

    if ($(this).val() === 'assets') {
      $('.outputs[value!="assets"]').attr('checked', false);
    } else {
      $('.outputs[value="assets"]').attr('checked', false);
    }

  });

});
