extends Node2D

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

func deploy_tower(position: Vector2) -> void:
    # Minimal placeholder; full implementation can spawn tower scenes.
    resources["credits"] = max(resources["credits"] - 5, 0)

func update_resources(delta: float) -> void:
    resources["credits"] += int(delta * 2.0)
