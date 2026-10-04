import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProperties, validateRelations, DOMAIN_MANIFEST } from '../build/shared/domain.js';

for (const [bp, def] of Object.entries(DOMAIN_MANIFEST)) {
  for (const [name, rel] of Object.entries(def.relations)) {
    if ((bp === 'co_job' && name === 'subcontractors') || (bp === 'co_subcontractor' && name === 'jobs')) continue;
    test(`v040: ${bp}.${name} rejects a list because supplied many=false`, () => {
      assert.throws(() => validateRelations(bp, { [name]: ['id-1'] }), /INVALID_CARDINALITY/);
      assert.deepEqual(validateRelations(bp, { [name]: null }), { [name]: null });
    });
  }
}
test('v040: full painting and shared fields are accepted with explicit types', () => {
  const p = {trade:'painting', surface_condition:'poor', number_of_coats:2, ceiling_height_ft:12,
    paint_surface_type:'interior_walls', paint_finish:'eggshell', lead_hazard_present:false};
  assert.deepEqual(validateProperties('co_trade_spec', p), p);
});
test('v040: roofing/HVAC/plumbing/electrical/concrete/drywall/door/landscape fields are typed', () => {
  for (const p of [{roof_pitch:'steep',skylight_count:2}, {hvac_system_type:'heat_pump',tonnage:3},
    {pipe_material:'pex',drain_cleaning:true}, {electrical_service_type:'commercial',panel_amps:200},
    {concrete_type:'slab',reinforcement:'rebar'}, {drywall_type:'fire_rated',finishing_level:'level_5'},
    {door_type:'double',spring_type:'torsion'}, {landscape_service_type:'irrigation',sod_or_seed:'na'}]) {
    assert.deepEqual(validateProperties('co_trade_spec',p),p);
  }
});
test('v040: trade field enum typos and wrong types are rejected', () => {
  assert.throws(()=>validateProperties('co_trade_spec',{paint_finish:'shiny'}),/INVALID_ENUM/);
  assert.throws(()=>validateProperties('co_trade_spec',{number_of_coats:'2'}),/INVALID_PROPERTY/);
});
