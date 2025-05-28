<?php
// guardar_datos.php

// Leer el contenido JSON que envía JavaScript
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['angulos'])) {
    echo "Datos inválidos";
    exit;
}

$angulos = $data['angulos'];

// Ruta del archivo donde se guardarán los datos
$archivo = 'datos.txt';

// Crear un registro JSON con fecha y ángulos
$registro = json_encode([
    'fecha' => date('Y-m-d H:i:s'),
    'angulos' => $angulos
]) . PHP_EOL;

// Guardar al final del archivo datos.txt (lo crea si no existe)
file_put_contents($archivo, $registro, FILE_APPEND | LOCK_EX);

echo "Datos guardados correctamente";
?>
