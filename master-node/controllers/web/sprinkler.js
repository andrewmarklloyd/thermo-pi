var id_token;
function onSignIn(googleUser) {
  id_token = googleUser.getAuthResponse().id_token;

  const socket = io('/updates.client');
  socket.on('connect', function(){
    socket.emit('authentication', {id_token});
    socket.on('authenticated', function() {
      $('#master-connection').removeClass('badge-danger');
      $('#master-connection').addClass('badge-success');
      // socket.on('current', function(data){
      //   $(`#${data.room}-current`).html(data.temp.toFixed(2));
      // });
      socket.on('disconnect', function(){
        $('#master-connection').removeClass('badge-success');
        $('#master-connection').addClass('badge-danger');
        ['1', '2', '3'].forEach(zone => {
          $(`#zone${zone}-connection`).removeClass('badge-success');
          $(`#zone${zone}-connection`).addClass('badge-danger');
        })
      });
    });
    socket.on('zone-connection', function(data) {
      if (data.status === 'connected') {
        $(`#zone${data.zone}-connection`).removeClass('badge-danger');
        $(`#zone${data.zone}-connection`).addClass('badge-success');
      } else if (data.status === 'disconnected') {
        $(`#zone${data.zone}-connection`).removeClass('badge-warning');
        $(`#zone${data.zone}-connection`).addClass('badge-danger');
      }
    });
  });
}

$(function () {
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
