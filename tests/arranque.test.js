const { test } = require('node:test');
const assert = require('node:assert/strict');
const { comprobarBase, diagnosticoSeguro } = require('../src/servicios/arranque');

test('no valida modelos ni permite continuar si falta una migración', async () => {
  let leyoModelos = false;
  const conexion = { authenticate: async () => {}, models: { producto: { findAll: async () => { leyoModelos = true; } } } };
  await assert.rejects(comprobarBase(conexion, { pending: async () => [{ name: '002-ventas.js' }] }), error => error.code === 'MIGRACIONES_PENDIENTES');
  assert.equal(leyoModelos, false);
});

test('valida las columnas antes del arranque y propaga el error del esquema', async () => {
  const fallo = Object.assign(new Error('No debe mostrarse este detalle'), { original: { code: 'ER_BAD_FIELD_ERROR' } });
  const conexion = { authenticate: async () => {}, models: { ventas: { findAll: async opciones => { assert.equal(opciones.limit, 0); throw fallo; } } } };
  await assert.rejects(comprobarBase(conexion, { pending: async () => [] }), error => error === fallo);
  assert.equal(diagnosticoSeguro(fallo), 'ER_BAD_FIELD_ERROR');
});

test('el diagnóstico omite mensaje, SQL y valores de configuración', () => {
  const error = { message: 'dato reservado', sql: 'consulta reservada', original: { code: 'ER_NO_SUCH_TABLE', sqlMessage: 'detalle reservado' } };
  assert.equal(diagnosticoSeguro(error), 'ER_NO_SUCH_TABLE');
  assert.equal(diagnosticoSeguro({ code: 'dato reservado' }), 'ERROR_NO_CLASIFICADO');
});
