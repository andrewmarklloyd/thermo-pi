var id_token;
function onSignIn(googleUser) {
  id_token = googleUser.getAuthResponse().id_token;
  $.post({
    type: "POST",
    url: `/login`,
    contentType: 'application/json',
    data: JSON.stringify({id_token}),
    success: function (data) {
      var urlParams = new URLSearchParams(location.search);
      window.location.href = '/' + urlParams.get('refer');
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
}
