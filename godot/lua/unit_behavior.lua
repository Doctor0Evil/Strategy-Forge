local M = {}

local resources = {
  ore = 0,
  energy = 0,
  credits = 0
}

local units = {
  miners = 0,
  drones = 0,
  turrets = 0
}

function M.update_resources(dt)
  local miners = math.max(units.miners, 0)
  local drones = math.max(units.drones, 0)
  resources.ore = resources.ore + miners * 2
  resources.energy = resources.energy + drones * 3
  resources.credits = resources.credits + math.floor((resources.ore + resources.energy) * 0.1)
  return resources
end

function M.deploy_unit(unit_type)
  if unit_type == "miners" then
    units.miners = units.miners + 1
  elseif unit_type == "drones" then
    units.drones = units.drones + 1
  elseif unit_type == "turrets" then
    units.turrets = units.turrets + 1
  end
  return units
end

return M
