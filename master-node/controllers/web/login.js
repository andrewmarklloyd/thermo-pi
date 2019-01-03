var id_token;
function onSignIn(googleUser) {
  id_token = googleUser.getAuthResponse().id_token;
  $.post({
    type: "POST",
    url: `/login`,
    contentType: 'application/json',
    data: JSON.stringify({id_token}),
    success: function (data) {
      window.location.href = '/';
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
}
