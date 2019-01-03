$(function () {
  $('#config-form').validator();

  function objectifyForm(formArray) {
    var returnArray = {};
    for (var i = 0; i < formArray.length; i++){
      returnArray[formArray[i]['name']] = formArray[i]['value'];
    }
    return returnArray;
  }

  $('#config-form').on('submit', function (e) {
    if (!e.isDefaultPrevented()) {
      $.post({
        type: "POST",
        url: '/',
        contentType: 'application/json',
        data: JSON.stringify(objectifyForm($(this).serializeArray())),
        success: function (data) {
          var alertBox = '<div class="alert alert-success alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Thermo-Pi successfully configured. Device will now restart. Please wait a few minutes and refresh the page.</div>';
          $('#config-form').find('.messages').html(alertBox);
          $('#config-form')[0].reset();
        }
      });
      return false;
    }
  })
});
