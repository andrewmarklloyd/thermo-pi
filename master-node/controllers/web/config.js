var id_token;
function onSignIn(googleUser) {
  id_token = googleUser.getAuthResponse().id_token;
  var profile = googleUser.getBasicProfile();
}

$(function () {
  $('#config-form').validator();

  function objectifyForm(formArray) {
    var returnArray = {};
    for (var i = 0; i < formArray.length; i++){
      returnArray[formArray[i]['name']] = formArray[i]['value'];
    }
    return returnArray;
  }



  const socket = io('/updates.client');
  socket.on('connect', function(){
    $('#master-connection').removeClass('badge-danger');
    $('#master-connection').addClass('badge-success');
  });
  socket.on('desired', function(data){
    $(`#${data.room}-desired`).html(data.temp);
  });
  socket.on('current', function(data){
    $(`#${data.room}-current`).html(data.temp.toFixed(2));
  });
  socket.on('disconnect', function(){
    $('#master-connection').removeClass('badge-success');
    $('#master-connection').addClass('badge-danger');
    ['kitchen', 'living', 'laundry'].forEach(room => {
      $(`#${room}-connection`).removeClass('badge-success');
      $(`#${room}-connection`).addClass('badge-danger');
    })
  });
  socket.on('worker-connection', function(data) {
    if (data.status === 'connected') {
      $(`#${data.room}-connection`).removeClass('badge-danger');
      $(`#${data.room}-connection`).addClass('badge-success');
    } else if (data.status === 'disconnected') {
      $(`#${data.room}-connection`).removeClass('badge-warning');
      $(`#${data.room}-connection`).addClass('badge-danger');
    }
  });

  function changeDesiredTemperature(room, direction) {
    $.post({
      type: "POST",
      url: `/temp`,
      contentType: 'application/json',
      data: JSON.stringify({room, direction, id_token}),
      success: function (data) {
        $(`#${room}-desired`).html(JSON.parse(data).desiredTemp);
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        console.log(errorThrown);
      }
    });
    return false;
  }

  const rooms = ['kitchen', 'laundry', 'living'];
  rooms.forEach(room => {
    $(`#${room}-up`).on('click', function (e) {
      if (!e.isDefaultPrevented()) {
        changeDesiredTemperature(room, 'up')
      }
    })

    $(`#${room}-down`).on('click', function (e) {
      if (!e.isDefaultPrevented()) {
        changeDesiredTemperature(room, 'down')
      }
    })
  })
});
