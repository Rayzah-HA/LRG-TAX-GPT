# Automation Planning

## Automation Categories

### Lighting
| Automation | Trigger | Action | Priority | Status |
|-----------|---------|--------|----------|--------|
| Welcome Home | Person arrives home after sunset | Turn on entry + living room lights | High | Planned |
| Goodnight | Time (11pm) or voice command | All lights off, night light on | High | Planned |
| Morning Routine | Alarm dismissed or time-based | Gradual bedroom lights, kitchen on | Medium | Planned |
| Away Mode | All persons leave home | Turn off all lights | Medium | Planned |
| Motion Lights | Motion detected in hallway/bathroom | Turn on lights, auto-off after 5 min | Medium | Planned |

### Climate
| Automation | Trigger | Action | Priority | Status |
|-----------|---------|--------|----------|--------|
| Away Temperature | All persons leave | Set thermostat to eco mode | High | Planned |
| Sleep Temperature | Bedtime routine triggered | Lower temperature 2 degrees | Medium | Planned |
| Window Open Alert | Temperature sensor + contact sensor | Notify if HVAC running with window open | Low | Planned |

### Security
| Automation | Trigger | Action | Priority | Status |
|-----------|---------|--------|----------|--------|
| Door Left Open | Door contact sensor open > 10 min | Send notification | High | Planned |
| Night Lock Check | 11pm daily | Check all locks, lock if unlocked, notify | High | Planned |
| Motion While Away | Motion + nobody home | Send camera snapshot notification | High | Planned |
| Doorbell Alert | Doorbell pressed | Send snapshot to phone | Medium | Planned |

### Notifications
| Automation | Trigger | Action | Priority | Status |
|-----------|---------|--------|----------|--------|
| Low Battery Alert | Device battery < 20% | Push notification | Medium | Planned |
| Washer/Dryer Done | Power monitoring drops | Push notification | Low | Planned |
| Package Delivered | Doorbell camera or sensor | Push notification with snapshot | Low | Planned |

### Media & Entertainment
| Automation | Trigger | Action | Priority | Status |
|-----------|---------|--------|----------|--------|
| Movie Mode | Script triggered | Dim lights, set scene | Low | Planned |
| Music Mode | Script triggered | Set lighting to match mood | Low | Planned |

---

## Design Principles

1. **Reliable over clever** - Simple automations that always work beat complex ones that sometimes fail
2. **Fail safe** - If an automation fails, the house should still be functional
3. **Notification hygiene** - Only alert on things that need attention, avoid notification fatigue
4. **Guest-friendly** - Manual controls should always override automations
5. **Privacy-first** - Minimize cloud dependencies, prefer local processing

---

## Implementation Order

1. **Phase 1 (Foundation)**: Lighting basics, security alerts, lock checks
2. **Phase 2 (Comfort)**: Climate automations, morning/night routines
3. **Phase 3 (Quality of Life)**: Media scenes, appliance monitoring, advanced notifications
