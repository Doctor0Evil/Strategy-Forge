extends Node2D

@onready var miner_units := []
@onready var drone_units := []
@onready var turret_units := []

var resources := {
    "ore": 0,
    "energy": 0,
    "credits": 0
}

var units := {
    "miners": 0,
    "drones": 0,
    "turrets": 0
}

var collection_interval_sec := 5.0
var _elapsed := 0.0

func _ready() -> void:
    # Minimal binding, actual sprites/nodes are configured in the scene.
    pass

func _process(delta: float) -> void:
    _elapsed += delta
    if _elapsed >= collection_interval_sec:
        _elapsed = 0.0
        _auto_collect_resources()
        _sync_to_browser()

func _auto_collect_resources() -> void:
    var miners := max(units.get("miners", 0), 0)
    var drones := max(units.get("drones", 0), 0)
    resources["ore"] += miners * 2
    resources["energy"] += drones * 3
    resources["credits"] += int(0.1 * (resources["ore"] + resources["energy"]))

func _sync_to_browser() -> void:
    if Engine.has_singleton("JavaScriptBridge"):
        var payload := {
            "resources": resources,
            "units": units,
            "faction": ""
        }
        var js_code := "window.updateGameState && window.updateGameState(" + JSON.stringify(payload) + ");"
        JavaScriptBridge.eval(js_code)
