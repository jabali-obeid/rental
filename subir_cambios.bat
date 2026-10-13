@echo off
setlocal enabledelayedexpansion
title Subir Cambios - Eco Aventura

cd /d "%~dp0"

echo ======================================================
echo    Subiendo cambios a GitHub y Vercel...
echo ======================================================
echo.

echo 1. Agregando archivos modificados...
git add .
if errorlevel 1 goto error

echo 2. Guardando commit...
git commit -m "Actualizacion de tarifas, bloqueo PIN y mejoras de caja"
if errorlevel 1 (
    echo [Info] No habia cambios nuevos para commitear o ya estaban guardados.
)

echo.
echo 3. Enviando a GitHub (git push)...
git push origin main
if errorlevel 1 goto error

echo.
echo ======================================================
echo  EXITO: Cambios subidos correctamente.
echo  Vercel ya esta desplegando tu pagina web.
echo ======================================================
goto end

:error
echo.
echo ======================================================
echo  Ocurrio un error al intentar subir los cambios.
echo ======================================================

:end
echo.
pause
