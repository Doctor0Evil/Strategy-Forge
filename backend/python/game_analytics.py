import json
import sys

def resources_chart():
    data = {
        "type": "bar",
        "data": {
            "labels": ["Tick 1", "Tick 2", "Tick 3", "Tick 4"],
            "datasets": [
                {
                    "label": "Ore",
                    "backgroundColor": "rgba(59,130,246,0.6)",
                    "borderColor": "rgba(59,130,246,1)",
                    "data": [10, 24, 38, 55],
                },
                {
                    "label": "Energy",
                    "backgroundColor": "rgba(52,211,153,0.6)",
                    "borderColor": "rgba(52,211,153,1)",
                    "data": [5, 14, 29, 40],
                },
                {
                    "label": "Credits",
                    "backgroundColor": "rgba(248,250,252,0.6)",
                    "borderColor": "rgba(248,250,252,1)",
                    "data": [1, 4, 9, 18],
                },
            ],
        },
        "options": {
            "responsive": True,
            "plugins": {
                "legend": {"position": "bottom"},
                "title": {"display": True, "text": "Resource Flow (Ore / Energy / Credits)"}
            }
        }
    }
    print(json.dumps(data))

def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "resources":
        resources_chart()
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
