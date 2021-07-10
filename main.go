package main

import (
	"fmt"
	"net"
	"net/http"
	"os/exec"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {

	signingKey := []byte("secret")

	fmt.Println("Looking Glass for FRRouting/Quagga v.1")
	e := echo.New()
	e.GET("/api/v1/ping", ping)
	e.GET("/api/v1/traceroute", traceroute)
	e.GET("/api/v1/mtr", mtr)
	e.GET("/api/v1/bgpSummary", bgpSummary)
	e.GET("/api/v1/routeV4", routeV4)
	e.GET("/api/v1/routeV6", routeV6)
	e.Use(middleware.JWT(signingKey))
	e.HideBanner = true
	e.Logger.Fatal(e.Start(":8080"))
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
