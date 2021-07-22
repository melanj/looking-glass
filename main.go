package main

import (
	"context"
	"encoding/json"
	"fmt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"github.com/golang-jwt/jwt"
	"io/ioutil"

	"net"
	"net/http"
	"os/exec"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var (
	config = oauth2.Config{
		ClientID:     "<client_id>",
		ClientSecret: "<client_secret>",
		Scopes:       []string{"all"},
		RedirectURL:  "http://localhost:8080/login.html",
		Endpoint: github.Endpoint,
	}
)

func main() {

	signingKey := []byte("secret")

	fmt.Println("Looking Glass for FRRouting/Quagga v.1")
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Static("/", "static")
	e.GET("login/oauth2", authorize)

	g := e.Group("/api/v1")
	g.Use(middleware.JWT(signingKey))
	e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(10)))
	g.GET("/ping", ping)
	g.GET("/traceroute", traceroute)
	g.GET("/mtr", mtr)
	g.GET("/bgpSummary", bgpSummary)
	g.GET("/routeV4", routeV4)
	g.GET("/routeV6", routeV6)

	e.HideBanner = true
	e.Logger.Fatal(e.Start(":8080"))
}

func authorize(c echo.Context) error {

	code := c.QueryParam("code")

	oauthToken, err := config.Exchange(context.Background(), code)
	if err != nil {
		return echo.ErrUnauthorized
	}

	tr := &http.Transport{}
	client := &http.Client{Transport: tr}
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", fmt.Sprintf("token %s", oauthToken.AccessToken))
	resp, err := client.Do(req)

	if err != nil {
		return err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)

	var userInfo map[string]interface{}
	if err = json.Unmarshal(body, &userInfo); err != nil {
		return err
	}

	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["name"] = userInfo["name"]
	claims["admin"] = false
	claims["exp"] = time.Now().Add(time.Hour * 4).Unix()

	t, err := token.SignedString([]byte("secret"))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]string{
		"token": t,
	})
}

func ping(c echo.Context) error {
	IP := c.QueryParam("ip")
	count := queryParamInt(c, "count", 4)
	if net.ParseIP(IP) == nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("IP Address: %s - Invalid", IP))
	}
	args := fmt.Sprintf("ping -O -c %d %s", count, IP)
	return c.String(http.StatusOK, exeCmd(c, args))
}

func traceroute(c echo.Context) error {
	IP := c.QueryParam("ip")
	if net.ParseIP(IP) == nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("IP Address: %s - Invalid", IP))
	}
	args := fmt.Sprintf("traceroute %s", IP)
	return c.String(http.StatusOK, exeCmd(c, args))

}

func mtr(c echo.Context) error {
	IP := c.QueryParam("ip")
	if net.ParseIP(IP) == nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("IP Address: %s - Invalid", IP))
	}
	args := fmt.Sprintf("mtr -G 2 -c 5 -erwbz %s", IP)
	return c.String(http.StatusOK, exeCmd(c, args))
}

func bgpSummary(c echo.Context) error {
	args := "vtysh -c 'show bgp summary'"
	return c.String(http.StatusOK, exeCmd(c, args))
}

func routeV4(c echo.Context) error {
	IP := c.QueryParam("ip")
	if net.ParseIP(IP) == nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("IP Address: %s - Invalid", IP))
	}
	args := fmt.Sprintf("vtysh -c 'show ip bgp %s'", IP)
	return c.String(http.StatusOK, exeCmd(c, args))
}

func routeV6(c echo.Context) error {
	IP := c.QueryParam("ip")
	if net.ParseIP(IP) == nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("IP Address: %s - Invalid", IP))
	}
	args := fmt.Sprintf("vtysh -c 'show ipv6 bgp %s'", IP)
	return c.String(http.StatusOK, exeCmd(c, args))
}

func exeCmd(c echo.Context, args string) string {
	cmd := exec.Command("bash", "-c", args)
	out, err := cmd.CombinedOutput()
	if err != nil {
		c.String(http.StatusInternalServerError, "An error occurred")
	}
	return string(out)
}

func queryParamInt(c echo.Context, name string, defaultValue int) int {
	param := c.QueryParam(name)
	result, err := strconv.Atoi(param)
	if err != nil {
		return defaultValue
	}
	return result
}
