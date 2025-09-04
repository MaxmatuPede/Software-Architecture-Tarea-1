vcl 4.1;

backend app {
  .host = "app";
  .port = "3000";
}

import std;

sub vcl_recv {
  set req.backend_hint = app;

  # Si hay Authorization, evita cachear
  if (req.http.Authorization) {
    return (pass);
  }

  return (hash);
}

sub vcl_backend_response {
  # Cachea agresivo /uploads y estáticos
  if (bereq.url ~ "^/uploads/" ||
      bereq.url ~ "^/assets/" ||
      bereq.url ~ "\.(png|jpe?g|gif|webp|svg|ico|css|js)(\?.*)?$") {
    set beresp.ttl = 24h;
    if (beresp.http.Set-Cookie) { unset beresp.http.Set-Cookie; }
    if (beresp.http.Content-Type ~ "image") {
      set beresp.do_gzip = false;
      set beresp.do_gunzip = false;
    }
  }
}

sub vcl_deliver {
  if (obj.hits > 0) {
    set resp.http.X-Cache = "HIT";
  } else {
    set resp.http.X-Cache = "MISS";
  }
}
