


while true; do
  echo "==== $(date) ===="

  for DOMAIN in dfsvision.com www.dfsvision.com; do
    
    DNS=$(dig +short A "$DOMAIN" @1.1.1.1)
    if [ -z "$DNS" ]; then
      echo "$DOMAIN DNS: ❌ Not resolved yet"
    else
      echo "$DOMAIN DNS: ✅ Resolved to $DNS"
    fi

    
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
    if [ "$HTTP" = "200" ]; then
      echo "$DOMAIN HTTP: ✅ 200 OK"
    elif [[ "$HTTP" = 3* ]]; then
      REDIR=$(curl -s -I "https://$DOMAIN" | grep -i location | awk '{print $2}' | tr -d '\r')
      echo "$DOMAIN HTTP: 🔀 $HTTP Redirects to: $REDIR"
    else
      echo "$DOMAIN HTTP: ⚠️ $HTTP"
    fi

    echo ""
  done

  sleep 30
done