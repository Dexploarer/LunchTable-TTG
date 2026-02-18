// Auto-generated from lunchtable_card_set_complete.csv
// 132 unique cards across 6 archetypes: Dropouts, Preps, Geeks, Freaks, Nerds, Goodies
// Each archetype has: 5 Stereotypes, 8 Spells, 6 Traps, 3 Environments = 22 unique, 40 per deck

export const CARD_DEFINITIONS = [
  {
    "name": "Crypto All-In Carl",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "stereotype",
    "cost": 1,
    "level": 6,
    "attack": 2000,
    "defense": 1000,
    "attribute": "Crypto",
    "ability": [
      {
        "trigger": "OnSpellPlayed",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self",
          "alliedStereotypes"
        ],
        "operations": [
          "DESTROY: alliedStereotypes",
          "MODIFY_STAT: reputation +1500"
        ]
      }
    ]
  },
  {
    "name": "Back Alley Bookie",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1700,
    "defense": 1200,
    "attribute": "Gambling",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "RANDOM_GAIN: reputation +500 to winner"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 3",
          "MODIFY_STAT: reputation -1000?"
        ]
      }
    ]
  },
  {
    "name": "Late Rent Ricky",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1600,
    "defense": 900,
    "attribute": "Avoidance",
    "ability": [
      {
        "trigger": "OnSummon",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "GRANT_IMMUNITY: trap targeting until end of turn"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "SKIP_NEXT_DRAW_PHASE",
          "MODIFY_STAT: reputation +1000"
        ]
      }
    ]
  },
  {
    "name": "Detention Dealer",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1800,
    "defense": 1100,
    "attribute": "Hustle",
    "ability": [
      {
        "trigger": "OnSpellPlayed",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: 2"
        ]
      }
    ]
  },
  {
    "name": "Community College King",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1500,
    "defense": 1500,
    "attribute": "Delusion",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +200 per Dropout you control"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +1000"
        ]
      }
    ]
  },
  {
    "name": "One More Shot",
    "rarity": "common",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500",
          "MODIFY_STAT: stability -300"
        ]
      }
    ]
  },
  {
    "name": "Text Your Ex",
    "rarity": "common",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "opponent",
          "self"
        ],
        "operations": [
          "DISCARD: 1",
          "MODIFY_STAT: stability -200 to self"
        ]
      }
    ]
  },
  {
    "name": "Skip Work",
    "rarity": "common",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "SKIP_NEXT_BATTLE_PHASE",
          "DRAW: 2"
        ]
      }
    ]
  },
  {
    "name": "Start a Podcast",
    "rarity": "common",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300",
          "DRAW: 1"
        ]
      }
    ]
  },
  {
    "name": "All-In Gamble",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +1000",
          "MODIFY_STAT: stability -700"
        ]
      }
    ]
  },
  {
    "name": "Side Hustle",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +200 per card in graveyard"
        ]
      }
    ]
  },
  {
    "name": "Last-Minute Borrow",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "opponent",
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500 to self",
          "MODIFY_STAT: reputation -500 to opponent",
          "MODIFY_STAT: stability +500 to opponent"
        ]
      }
    ]
  },
  {
    "name": "Wingman Wager",
    "rarity": "common",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "RANDOM_GAIN: reputation +700 to winner"
        ]
      }
    ]
  },
  {
    "name": "HR Complaint",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentStereotypeSummoned",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -500"
        ]
      }
    ]
  },
  {
    "name": "DUI Checkpoint",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentSpellActivation",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -400"
        ]
      }
    ]
  },
  {
    "name": "Child Support Reminder",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnAttackDeclaration",
        "speed": 2,
        "targets": [
          "attacker"
        ],
        "operations": [
          "MODIFY_STAT: reputation -300"
        ]
      }
    ]
  },
  {
    "name": "Debt Collector",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnDestroy",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: 1"
        ]
      }
    ]
  },
  {
    "name": "Rock Bottom",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnStabilityZero",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 3"
        ]
      }
    ]
  },
  {
    "name": "Rehabilitation",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnDestroy",
        "speed": 2,
        "targets": [
          "destroyedCard"
        ],
        "operations": [
          "MOVE_TO_ZONE: destroyedCard to hand"
        ]
      }
    ]
  },
  {
    "name": "Back Alley Poker Night",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Dropouts"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: stability -200"
        ]
      }
    ]
  },
  {
    "name": "Dive Bar Karaoke",
    "rarity": "uncommon",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnDrawPhase",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "DRAW: 1",
          "MODIFY_STAT: stability -100"
        ]
      }
    ]
  },
  {
    "name": "Unpaid Internship",
    "rarity": "rare",
    "archetype": "dropouts",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "Dropouts"
        ],
        "operations": [
          "MODIFY_STAT: reputation +100 per card"
        ]
      },
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "Preps"
        ],
        "operations": [
          "MODIFY_STAT: reputation -100"
        ]
      }
    ]
  },
  {
    "name": "Washed Varsity Legend",
    "rarity": "ultra_rare",
    "archetype": "preps",
    "cardType": "stereotype",
    "cost": 2,
    "level": 7,
    "attack": 2100,
    "defense": 1400,
    "attribute": "Validation",
    "ability": [
      {
        "trigger": "OnCardDestroyed",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "STEAL: 1 stereotype for 1 turn"
        ]
      }
    ]
  },
  {
    "name": "Party Queen Bri",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1900,
    "defense": 1200,
    "attribute": "Alcohol",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "allStereotypes"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: stability -800"
        ]
      }
    ]
  },
  {
    "name": "Homecoming Committee",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1200,
    "defense": 2000,
    "attribute": "Status",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "Preps"
        ],
        "operations": [
          "MODIFY_STAT: stability +500"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "Environment"
        ],
        "operations": [
          "DESTROY: 1"
        ]
      }
    ]
  },
  {
    "name": "Corporate Ladder Chad",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "stereotype",
    "cost": 1,
    "level": 6,
    "attack": 1800,
    "defense": 1700,
    "attribute": "Ambition",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "cost": "Sacrifice 1 card",
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +700"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -1000"
        ]
      }
    ]
  },
  {
    "name": "Influencer Couple",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1600,
    "defense": 1500,
    "attribute": "Social Media",
    "ability": [
      {
        "trigger": "OnSummon",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 1"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: 2 random"
        ]
      }
    ]
  },
  {
    "name": "Senior Party",
    "rarity": "common",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Preps",
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500 to Preps",
          "MODIFY_STAT: stability -200 to all players"
        ]
      }
    ]
  },
  {
    "name": "Networking Event",
    "rarity": "common",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self",
          "Preps"
        ],
        "operations": [
          "DRAW: 2",
          "MODIFY_STAT: reputation +300 to Preps"
        ]
      }
    ]
  },
  {
    "name": "Sponsorship Deal",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +700",
          "MODIFY_STAT: stability -300"
        ]
      }
    ]
  },
  {
    "name": "Dress Code Violation",
    "rarity": "common",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -400"
        ]
      }
    ]
  },
  {
    "name": "Rumor Mill",
    "rarity": "common",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "opponent",
          "self"
        ],
        "operations": [
          "DISCARD: 1 from opponent",
          "DRAW: 1"
        ]
      }
    ]
  },
  {
    "name": "Study Abroad",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Preps",
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +300 to Preps",
          "SKIP_NEXT_TURN: self"
        ]
      }
    ]
  },
  {
    "name": "Fundraiser",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500 per Prep you control"
        ]
      }
    ]
  },
  {
    "name": "Social Media Blitz",
    "rarity": "common",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "allPlayers",
          "self"
        ],
        "operations": [
          "DRAW: 1",
          "MODIFY_STAT: reputation +200 to all stereotypes"
        ]
      }
    ]
  },
  {
    "name": "Probation",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentAttackDeclaration",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISABLE_BATTLE_PHASE: opponent next"
        ]
      }
    ]
  },
  {
    "name": "Screenshots Leaked",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentSpellActivation",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "NEGATE: spell",
          "MODIFY_STAT: reputation -500"
        ]
      }
    ]
  },
  {
    "name": "Parent-Teacher Conference",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnTrapTargetingYou",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "NEGATE: trap"
        ]
      }
    ]
  },
  {
    "name": "Disciplinary Action",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentEffectResolution",
        "speed": 2,
        "targets": [
          "opponentCard"
        ],
        "operations": [
          "DESTROY: opponentCard"
        ]
      }
    ]
  },
  {
    "name": "Surprise Quiz",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnDeckEmpty",
        "speed": 2,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "MOVE_TO_ZONE: graveyard to deck",
          "SHUFFLE"
        ]
      }
    ]
  },
  {
    "name": "Slander",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentStereotypeSummoned",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -700"
        ]
      }
    ]
  },
  {
    "name": "Class Reunion",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Preps"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Dropouts"
        ],
        "operations": [
          "MODIFY_STAT: reputation -300"
        ]
      }
    ]
  },
  {
    "name": "Corporate Happy Hour",
    "rarity": "uncommon",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: reputation +200",
          "MODIFY_STAT: stability -100"
        ]
      }
    ]
  },
  {
    "name": "College Campus",
    "rarity": "rare",
    "archetype": "preps",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "spells"
        ],
        "operations": [
          "MODIFY_COST: spells to 0"
        ]
      },
      {
        "trigger": "OnTrapActivation",
        "speed": 1,
        "targets": [
          "traps"
        ],
        "operations": [
          "MODIFY_COST: traps x2"
        ]
      }
    ]
  },
  {
    "name": "Hackathon Hero",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1400,
    "defense": 1600,
    "attribute": "Adderall",
    "ability": [
      {
        "trigger": "OnSpellPlayed",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 1"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "SKIP_NEXT_BATTLE_PHASE",
          "DRAW: 3"
        ]
      }
    ]
  },
  {
    "name": "LAN Party Larry",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1500,
    "defense": 1500,
    "attribute": "Isolation",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300 per Geek you control"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "GRANT_IMMUNITY: battle destruction for next turn"
        ]
      }
    ]
  },
  {
    "name": "Debugging Dana",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1300,
    "defense": 1800,
    "attribute": "Perfectionism",
    "ability": [
      {
        "trigger": "OnTrapActivated",
        "speed": 2,
        "targets": [
          "trap"
        ],
        "operations": [
          "NEGATE: trap"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "traps"
        ],
        "operations": [
          "DESTROY: all traps"
        ]
      }
    ]
  },
  {
    "name": "Keyboard Warrior",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1700,
    "defense": 1100,
    "attribute": "Rage",
    "ability": [
      {
        "trigger": "OnAttackDeclaration",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "FORCE_ATTACK: each turn"
        ]
      }
    ]
  },
  {
    "name": "Indie Dev Dropout",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1800,
    "defense": 1000,
    "attribute": "Burnout",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +600",
          "MODIFY_STAT: stability -400"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DISABLE_EFFECTS: 2 turns"
        ]
      }
    ]
  },
  {
    "name": "Code Refactor",
    "rarity": "common",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "VIEW_TOP_CARDS: 3",
          "REARRANGE_CARDS"
        ]
      }
    ]
  },
  {
    "name": "All-Nighter",
    "rarity": "common",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 2",
          "MODIFY_STAT: stability -400"
        ]
      }
    ]
  },
  {
    "name": "Cheat Sheet",
    "rarity": "common",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "COPY_LAST_SPELL_EFFECT",
          "MODIFY_STAT: stability +200"
        ]
      }
    ]
  },
  {
    "name": "Hardware Upgrade",
    "rarity": "common",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Geek"
        ],
        "operations": [
          "MODIFY_STAT: reputation +800"
        ]
      }
    ]
  },
  {
    "name": "Debugging Session",
    "rarity": "common",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "trap"
        ],
        "operations": [
          "NEGATE: trap",
          "DRAW: 1"
        ]
      }
    ]
  },
  {
    "name": "Stack Overflow",
    "rarity": "common",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: number of Geeks you control"
        ]
      }
    ]
  },
  {
    "name": "Coffee Break",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +300",
          "DISABLE_ATTACKS: 1 turn"
        ]
      }
    ]
  },
  {
    "name": "Open Source",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self",
          "opponent"
        ],
        "operations": [
          "DRAW: 1 for both",
          "MODIFY_STAT: reputation +300 to self"
        ]
      }
    ]
  },
  {
    "name": "Critical Bug",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentCardActivation",
        "speed": 2,
        "targets": [
          "opponentCard"
        ],
        "operations": [
          "NEGATE"
        ]
      }
    ]
  },
  {
    "name": "Blue Screen",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentDrawPhaseStart",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISABLE_DRAW_PHASE: 1"
        ]
      }
    ]
  },
  {
    "name": "System Overload",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnSpellCountThree",
        "speed": 2,
        "targets": [
          "field"
        ],
        "operations": [
          "DESTROY: all spells"
        ]
      }
    ]
  },
  {
    "name": "404 Error",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnAttackDeclaration",
        "speed": 2,
        "targets": [
          "attacker"
        ],
        "operations": [
          "NEGATE: attack"
        ]
      }
    ]
  },
  {
    "name": "Brain Fog",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentDrawPhaseStart",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: 2"
        ]
      }
    ]
  },
  {
    "name": "Kernel Panic",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnStabilityBelowThreshold",
        "speed": 2,
        "targets": [
          "field"
        ],
        "operations": [
          "DESTROY: all traps"
        ]
      }
    ]
  },
  {
    "name": "Hackathon",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnDrawPhase",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "DRAW: 1"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Geeks"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      }
    ]
  },
  {
    "name": "LAN Arena",
    "rarity": "uncommon",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Geeks"
        ],
        "operations": [
          "MODIFY_STAT: stability +200"
        ]
      },
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "spells"
        ],
        "operations": [
          "MODIFY_COST: spells -1"
        ]
      }
    ]
  },
  {
    "name": "Campus Library",
    "rarity": "rare",
    "archetype": "geeks",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 1"
        ]
      },
      {
        "trigger": "OnAttackDeclaration",
        "speed": 1,
        "targets": [
          "attacker"
        ],
        "operations": [
          "REDUCE_DAMAGE: 50%"
        ]
      }
    ]
  },
  {
    "name": "Conspiracy Kyle",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1600,
    "defense": 1300,
    "attribute": "Paranoia",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: 1 random"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "MOVE_TO_ZONE: hand to deck",
          "SHUFFLE"
        ]
      }
    ]
  },
  {
    "name": "Tattooed Philosophy Major",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1700,
    "defense": 1400,
    "attribute": "Existentialism",
    "ability": [
      {
        "trigger": "OnStabilityBelowThreshold",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +800"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: reputation -500"
        ]
      }
    ]
  },
  {
    "name": "Afterparty Goblin",
    "rarity": "ultra_rare",
    "archetype": "freaks",
    "cardType": "stereotype",
    "cost": 2,
    "level": 6,
    "attack": 2000,
    "defense": 900,
    "attribute": "Alcohol",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +400 per spell in graveyard"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "field"
        ],
        "operations": [
          "DESTROY: 1 random card"
        ]
      }
    ]
  },
  {
    "name": "Basement Streamer",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1500,
    "defense": 1400,
    "attribute": "Validation",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation +200"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation *2"
        ]
      }
    ]
  },
  {
    "name": "Gas Station Mystic",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1400,
    "defense": 1700,
    "attribute": "Conspiracy",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "targets": [
          "opponent"
        ],
        "operations": [
          "REVEAL_HAND"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: all"
        ]
      }
    ]
  },
  {
    "name": "Sudden Epiphany",
    "rarity": "common",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MOVE_TO_ZONE: hand to deck",
          "SHUFFLE",
          "DRAW: hand_size +1"
        ]
      }
    ]
  },
  {
    "name": "Midnight Tattoo",
    "rarity": "common",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Freaks"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500"
        ]
      }
    ]
  },
  {
    "name": "Impromptu Jam",
    "rarity": "common",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "DISCARD: 2",
          "DRAW: 2"
        ]
      }
    ]
  },
  {
    "name": "Chaotic Muse",
    "rarity": "common",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "RANDOM_CARD: from deck to hand"
        ]
      }
    ]
  },
  {
    "name": "Street Performance",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Freaks",
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +300 to Freaks",
          "MODIFY_STAT: reputation -300 to self"
        ]
      }
    ]
  },
  {
    "name": "Experimental Brew",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "RANDOM_MODIFY_STAT: reputation +/-400"
        ]
      }
    ]
  },
  {
    "name": "Dumpster Dive",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MOVE_TO_ZONE: selected card from graveyard to hand",
          "MODIFY_STAT: stability -200"
        ]
      }
    ]
  },
  {
    "name": "Flash Mob",
    "rarity": "common",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Freaks"
        ],
        "operations": [
          "FORCE_ATTACK: all Freaks immediately"
        ]
      }
    ]
  },
  {
    "name": "Mood Swing",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentAttackDeclaration",
        "speed": 2,
        "targets": [
          "attacker"
        ],
        "operations": [
          "CHANGE_ATTACK_TARGET"
        ]
      }
    ]
  },
  {
    "name": "Self-Sabotage",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnReputationGain",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation -X (equal to gained)"
        ]
      }
    ]
  },
  {
    "name": "Wild Card",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentSpellActivation",
        "speed": 2,
        "targets": [
          "spell"
        ],
        "operations": [
          "RANDOM_NEGATE"
        ]
      }
    ]
  },
  {
    "name": "Public Meltdown",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnStabilityZero",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -1000"
        ]
      }
    ]
  },
  {
    "name": "Anarchy",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnTrapActivation",
        "speed": 2,
        "targets": [
          "field"
        ],
        "operations": [
          "ACTIVATE_TRAPS_TWICE"
        ]
      }
    ]
  },
  {
    "name": "Peer Pressure",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentSummon",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: stability -500"
        ]
      }
    ]
  },
  {
    "name": "Underground Club",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Freaks"
        ],
        "operations": [
          "MODIFY_STAT: reputation +400"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Preps"
        ],
        "operations": [
          "MODIFY_STAT: reputation -200"
        ]
      }
    ]
  },
  {
    "name": "Street Art Alley",
    "rarity": "uncommon",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnGameStart",
        "speed": 1,
        "targets": [
          "Freaks"
        ],
        "operations": [
          "GRANT_IMMUNITY: traps"
        ]
      },
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "spells"
        ],
        "operations": [
          "MODIFY_COST: spells +1"
        ]
      }
    ]
  },
  {
    "name": "Warehouse Rave",
    "rarity": "rare",
    "archetype": "freaks",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300",
          "MODIFY_STAT: stability -200"
        ]
      }
    ]
  },
  {
    "name": "Spreadsheet Assassin",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1700,
    "defense": 1700,
    "attribute": "Control",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +1000"
        ]
      }
    ]
  },
  {
    "name": "Debate Team Captain",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1500,
    "defense": 1900,
    "attribute": "Ego",
    "ability": [
      {
        "trigger": "OnEffectActivation",
        "speed": 2,
        "targets": [
          "effect"
        ],
        "operations": [
          "NEGATE"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISABLE_EFFECTS: 1 turn"
        ]
      }
    ]
  },
  {
    "name": "Scholarship Sniper",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "stereotype",
    "cost": 1,
    "level": 6,
    "attack": 1800,
    "defense": 1600,
    "attribute": "Pressure",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": "ignition",
        "targets": [
          "self"
        ],
        "operations": [
          "CONDITIONAL_MODIFY_STAT: reputation +500 if opponent hand > self hand"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "field"
        ],
        "operations": [
          "DESTROY: highest reputation card"
        ]
      }
    ]
  },
  {
    "name": "Lab Partner From Hell",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1600,
    "defense": 1500,
    "attribute": "Micromanagement",
    "ability": [
      {
        "trigger": "OnDrawPhase",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "REVEAL_HAND"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 2"
        ]
      }
    ]
  },
  {
    "name": "Test Curve Tyrant",
    "rarity": "ultra_rare",
    "archetype": "nerds",
    "cardType": "stereotype",
    "cost": 2,
    "level": 6,
    "attack": 1400,
    "defense": 2100,
    "attribute": "Perfection",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: stability -300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "SET_STAT: stability 1000"
        ]
      }
    ]
  },
  {
    "name": "Extra Credit",
    "rarity": "common",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "CONDITIONAL_DRAW: 2 if hand size < opponent"
        ]
      }
    ]
  },
  {
    "name": "Formula Memorization",
    "rarity": "common",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Nerd"
        ],
        "operations": [
          "MODIFY_STAT: reputation +600"
        ]
      }
    ]
  },
  {
    "name": "Pop Quiz",
    "rarity": "common",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "bothPlayers",
          "Nerds"
        ],
        "operations": [
          "REVEAL_HAND: both",
          "MODIFY_STAT: stability +200 to Nerds"
        ]
      }
    ]
  },
  {
    "name": "Study Group",
    "rarity": "common",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: number of Nerds you control"
        ]
      }
    ]
  },
  {
    "name": "Research Grant",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self",
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation +500 to self",
          "MODIFY_STAT: stability +200 to opponent"
        ]
      }
    ]
  },
  {
    "name": "Sleep Deprivation",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "SKIP_NEXT_DRAW_PHASE",
          "DRAW: 3"
        ]
      }
    ]
  },
  {
    "name": "Peer Review",
    "rarity": "common",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "trap",
          "self"
        ],
        "operations": [
          "NEGATE: trap",
          "MODIFY_STAT: reputation +300"
        ]
      }
    ]
  },
  {
    "name": "Logical Fallacy",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISCARD: chosen card"
        ]
      }
    ]
  },
  {
    "name": "Trick Question",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnAttackDeclaration",
        "speed": 2,
        "targets": [
          "attacker"
        ],
        "operations": [
          "NEGATE: attack",
          "DRAW: 1"
        ]
      }
    ]
  },
  {
    "name": "All-Night Study",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnStabilityBelowThreshold",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +800"
        ]
      }
    ]
  },
  {
    "name": "Lecture Time",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentStereotypeSummoned",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -300"
        ]
      }
    ]
  },
  {
    "name": "Data Breach",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "REVEAL_HAND",
          "DISCARD: 1"
        ]
      }
    ]
  },
  {
    "name": "Curveball",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentEffectActivation",
        "speed": 2,
        "targets": [
          "opponentCard"
        ],
        "operations": [
          "REVERSE_EFFECT"
        ]
      }
    ]
  },
  {
    "name": "Social Anxiety",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnBattlePhaseStart",
        "speed": 2,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "DISABLE_ATTACKS: 1 turn"
        ]
      }
    ]
  },
  {
    "name": "Campus Lab",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Nerds"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      },
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 2"
        ]
      }
    ]
  },
  {
    "name": "Debate Hall",
    "rarity": "uncommon",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTrapActivation",
        "speed": 1,
        "targets": [
          "traps"
        ],
        "operations": [
          "MODIFY_COST: traps -1"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Preps"
        ],
        "operations": [
          "MODIFY_STAT: reputation -200"
        ]
      }
    ]
  },
  {
    "name": "Library Basement",
    "rarity": "rare",
    "archetype": "nerds",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnEnvironmentActivation",
        "speed": 1,
        "targets": [
          "environment"
        ],
        "operations": [
          "NEGATE: environment"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Nerds"
        ],
        "operations": [
          "MODIFY_STAT: stability +100"
        ]
      }
    ]
  },
  {
    "name": "Student Council President",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1600,
    "defense": 2000,
    "attribute": "Morality",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "field"
        ],
        "operations": [
          "REMOVE_COUNTERS: vice"
        ]
      }
    ]
  },
  {
    "name": "Volunteer Valedictorian",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1500,
    "defense": 2100,
    "attribute": "Burnout",
    "ability": [
      {
        "trigger": "OnDestroy",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "NEGATE: destruction"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DISABLE_ATTACKS: 2 turns",
          "MODIFY_STAT: stability +1500"
        ]
      }
    ]
  },
  {
    "name": "Church Camp Survivor",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1400,
    "defense": 1900,
    "attribute": "Repression",
    "ability": [
      {
        "trigger": "OnAttackDeclaration",
        "speed": 2,
        "targets": [
          "attacker"
        ],
        "operations": [
          "MODIFY_STAT: stability -300"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: reputation -1000"
        ]
      }
    ]
  },
  {
    "name": "Attendance Award Annie",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "stereotype",
    "cost": 1,
    "level": 4,
    "attack": 1300,
    "defense": 2200,
    "attribute": "Validation",
    "ability": [
      {
        "trigger": "OnMainPhase",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +200"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "GRANT_IMMUNITY: battle destruction"
        ]
      }
    ]
  },
  {
    "name": "Hall Monitor Mark",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "stereotype",
    "cost": 1,
    "level": 5,
    "attack": 1700,
    "defense": 1800,
    "attribute": "Authority",
    "ability": [
      {
        "trigger": "OnAttackDeclaration",
        "speed": 1,
        "targets": [
          "opponent"
        ],
        "operations": [
          "FORCE_TARGET: this card must be attacked first"
        ]
      },
      {
        "trigger": "OnStabilityZero",
        "speed": 1,
        "targets": [
          "Dropouts"
        ],
        "operations": [
          "DESTROY: 1 Dropout"
        ]
      }
    ]
  },
  {
    "name": "Charity Drive",
    "rarity": "common",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self",
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: stability +300 to self",
          "MODIFY_STAT: reputation +200 to opponent"
        ]
      }
    ]
  },
  {
    "name": "Group Study",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "Goodies"
        ],
        "operations": [
          "MODIFY_STAT: reputation +300"
        ]
      }
    ]
  },
  {
    "name": "Meditation Session",
    "rarity": "common",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "targetCard"
        ],
        "operations": [
          "REMOVE_COUNTERS: vice"
        ]
      }
    ]
  },
  {
    "name": "Bake Sale",
    "rarity": "common",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 1",
          "MODIFY_STAT: reputation +200"
        ]
      }
    ]
  },
  {
    "name": "Community Service",
    "rarity": "common",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "opponent",
          "self"
        ],
        "operations": [
          "MODIFY_STAT: reputation -300 to opponent",
          "MODIFY_STAT: stability -300 to self"
        ]
      }
    ]
  },
  {
    "name": "Tutoring",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "self"
        ],
        "operations": [
          "DRAW: 2",
          "DISABLE_ATTACKS: this turn"
        ]
      }
    ]
  },
  {
    "name": "Apology Note",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "trap",
          "bothPlayers"
        ],
        "operations": [
          "NEGATE: trap",
          "DRAW: 1 for both"
        ]
      }
    ]
  },
  {
    "name": "Counseling Session",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 1,
    "spellType": "normal",
    "ability": [
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "DISCARD: all from both hands",
          "DRAW: equal to discarded"
        ]
      }
    ]
  },
  {
    "name": "Intervention",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentAttackDeclaration",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "DISABLE_BATTLE_PHASE: next turn"
        ]
      }
    ]
  },
  {
    "name": "Guilt Trip",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnOpponentReputationGain",
        "speed": 2,
        "targets": [
          "opponent"
        ],
        "operations": [
          "MODIFY_STAT: reputation -X (mirror)"
        ]
      }
    ]
  },
  {
    "name": "Moral High Ground",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnDestroy",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "MODIFY_STAT: stability +500"
        ]
      }
    ]
  },
  {
    "name": "Consequence",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnSpellResolution",
        "speed": 2,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "MODIFY_STAT: reputation -200"
        ]
      }
    ]
  },
  {
    "name": "Time-Out",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnTrapActivation",
        "speed": 2,
        "targets": [
          "bothPlayers"
        ],
        "operations": [
          "DISABLE_BATTLE_PHASE: next turn"
        ]
      }
    ]
  },
  {
    "name": "Volunteer Overload",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "trap",
    "cost": 1,
    "trapType": "normal",
    "ability": [
      {
        "trigger": "OnDrawPhase",
        "speed": 2,
        "targets": [
          "self"
        ],
        "operations": [
          "DISCARD: hand_size - 5 if hand > 5",
          "MODIFY_STAT: stability +300"
        ]
      }
    ]
  },
  {
    "name": "Soup Kitchen",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Goodies"
        ],
        "operations": [
          "MODIFY_STAT: reputation +200"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Dropouts"
        ],
        "operations": [
          "MODIFY_STAT: reputation -200"
        ]
      }
    ]
  },
  {
    "name": "Study Hall",
    "rarity": "uncommon",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnDrawPhase",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "DRAW: 1"
        ]
      },
      {
        "trigger": "OnSpellActivation",
        "speed": 1,
        "targets": [
          "spells"
        ],
        "operations": [
          "MODIFY_COST: spells +1"
        ]
      }
    ]
  },
  {
    "name": "Community Center",
    "rarity": "rare",
    "archetype": "goodies",
    "cardType": "spell",
    "cost": 2,
    "spellType": "field",
    "ability": [
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "allPlayers"
        ],
        "operations": [
          "MODIFY_STAT: stability +100"
        ]
      },
      {
        "trigger": "OnTurnStart",
        "speed": 1,
        "targets": [
          "Freaks"
        ],
        "operations": [
          "MODIFY_STAT: reputation -100"
        ]
      }
    ]
  }
] as const;

export const STARTER_DECKS = [
  {
    "name": "Dropout Gang",
    "deckCode": "dropouts_starter",
    "archetype": "dropouts",
    "description": "High-risk, high-reward chaos",
    "playstyle": "Aggro",
    "cardCount": 40
  },
  {
    "name": "Prep Squad",
    "deckCode": "preps_starter",
    "archetype": "preps",
    "description": "Status and social warfare",
    "playstyle": "Midrange",
    "cardCount": 40
  },
  {
    "name": "Geek Squad",
    "deckCode": "geeks_starter",
    "archetype": "geeks",
    "description": "Card draw and tech control",
    "playstyle": "Control",
    "cardCount": 40
  },
  {
    "name": "Freak Show",
    "deckCode": "freaks_starter",
    "archetype": "freaks",
    "description": "Disruption and chaos",
    "playstyle": "Tempo",
    "cardCount": 40
  },
  {
    "name": "Nerd Herd",
    "deckCode": "nerds_starter",
    "archetype": "nerds",
    "description": "Knowledge is power",
    "playstyle": "Combo",
    "cardCount": 40
  },
  {
    "name": "Goodie Two-Shoes",
    "deckCode": "goodies_starter",
    "archetype": "goodies",
    "description": "Order and protection",
    "playstyle": "Stall",
    "cardCount": 40
  }
];

export const DECK_RECIPES: Record<string, { cardName: string; copies: number }[]> = {
  "dropouts_starter": [
    { cardName: "Crypto All-In Carl", copies: 3 },
    { cardName: "Back Alley Bookie", copies: 3 },
    { cardName: "Late Rent Ricky", copies: 3 },
    { cardName: "Detention Dealer", copies: 3 },
    { cardName: "Community College King", copies: 3 },
    { cardName: "One More Shot", copies: 2 },
    { cardName: "Text Your Ex", copies: 2 },
    { cardName: "Skip Work", copies: 2 },
    { cardName: "Start a Podcast", copies: 2 },
    { cardName: "All-In Gamble", copies: 2 },
    { cardName: "Side Hustle", copies: 2 },
    { cardName: "Last-Minute Borrow", copies: 2 },
    { cardName: "Wingman Wager", copies: 2 },
    { cardName: "HR Complaint", copies: 1 },
    { cardName: "DUI Checkpoint", copies: 1 },
    { cardName: "Child Support Reminder", copies: 1 },
    { cardName: "Debt Collector", copies: 1 },
    { cardName: "Rock Bottom", copies: 1 },
    { cardName: "Rehabilitation", copies: 1 },
    { cardName: "Back Alley Poker Night", copies: 1 },
    { cardName: "Dive Bar Karaoke", copies: 1 },
    { cardName: "Unpaid Internship", copies: 1 },
  ],
  "freaks_starter": [
    { cardName: "Conspiracy Kyle", copies: 3 },
    { cardName: "Tattooed Philosophy Major", copies: 3 },
    { cardName: "Afterparty Goblin", copies: 3 },
    { cardName: "Basement Streamer", copies: 3 },
    { cardName: "Gas Station Mystic", copies: 3 },
    { cardName: "Sudden Epiphany", copies: 2 },
    { cardName: "Midnight Tattoo", copies: 2 },
    { cardName: "Impromptu Jam", copies: 2 },
    { cardName: "Chaotic Muse", copies: 2 },
    { cardName: "Street Performance", copies: 2 },
    { cardName: "Experimental Brew", copies: 2 },
    { cardName: "Dumpster Dive", copies: 2 },
    { cardName: "Flash Mob", copies: 2 },
    { cardName: "Mood Swing", copies: 1 },
    { cardName: "Self-Sabotage", copies: 1 },
    { cardName: "Wild Card", copies: 1 },
    { cardName: "Public Meltdown", copies: 1 },
    { cardName: "Anarchy", copies: 1 },
    { cardName: "Peer Pressure", copies: 1 },
    { cardName: "Underground Club", copies: 1 },
    { cardName: "Street Art Alley", copies: 1 },
    { cardName: "Warehouse Rave", copies: 1 },
  ],
  "geeks_starter": [
    { cardName: "Hackathon Hero", copies: 3 },
    { cardName: "LAN Party Larry", copies: 3 },
    { cardName: "Debugging Dana", copies: 3 },
    { cardName: "Keyboard Warrior", copies: 3 },
    { cardName: "Indie Dev Dropout", copies: 3 },
    { cardName: "Code Refactor", copies: 2 },
    { cardName: "All-Nighter", copies: 2 },
    { cardName: "Cheat Sheet", copies: 2 },
    { cardName: "Hardware Upgrade", copies: 2 },
    { cardName: "Debugging Session", copies: 2 },
    { cardName: "Stack Overflow", copies: 2 },
    { cardName: "Coffee Break", copies: 2 },
    { cardName: "Open Source", copies: 2 },
    { cardName: "Critical Bug", copies: 1 },
    { cardName: "Blue Screen", copies: 1 },
    { cardName: "System Overload", copies: 1 },
    { cardName: "404 Error", copies: 1 },
    { cardName: "Brain Fog", copies: 1 },
    { cardName: "Kernel Panic", copies: 1 },
    { cardName: "Hackathon", copies: 1 },
    { cardName: "LAN Arena", copies: 1 },
    { cardName: "Campus Library", copies: 1 },
  ],
  "goodies_starter": [
    { cardName: "Student Council President", copies: 3 },
    { cardName: "Volunteer Valedictorian", copies: 3 },
    { cardName: "Church Camp Survivor", copies: 3 },
    { cardName: "Attendance Award Annie", copies: 3 },
    { cardName: "Hall Monitor Mark", copies: 3 },
    { cardName: "Charity Drive", copies: 2 },
    { cardName: "Group Study", copies: 2 },
    { cardName: "Meditation Session", copies: 2 },
    { cardName: "Bake Sale", copies: 2 },
    { cardName: "Community Service", copies: 2 },
    { cardName: "Tutoring", copies: 2 },
    { cardName: "Apology Note", copies: 2 },
    { cardName: "Counseling Session", copies: 2 },
    { cardName: "Intervention", copies: 1 },
    { cardName: "Guilt Trip", copies: 1 },
    { cardName: "Moral High Ground", copies: 1 },
    { cardName: "Consequence", copies: 1 },
    { cardName: "Time-Out", copies: 1 },
    { cardName: "Volunteer Overload", copies: 1 },
    { cardName: "Soup Kitchen", copies: 1 },
    { cardName: "Study Hall", copies: 1 },
    { cardName: "Community Center", copies: 1 },
  ],
  "nerds_starter": [
    { cardName: "Spreadsheet Assassin", copies: 3 },
    { cardName: "Debate Team Captain", copies: 3 },
    { cardName: "Scholarship Sniper", copies: 3 },
    { cardName: "Lab Partner From Hell", copies: 3 },
    { cardName: "Test Curve Tyrant", copies: 3 },
    { cardName: "Extra Credit", copies: 2 },
    { cardName: "Formula Memorization", copies: 2 },
    { cardName: "Pop Quiz", copies: 2 },
    { cardName: "Study Group", copies: 2 },
    { cardName: "Research Grant", copies: 2 },
    { cardName: "Sleep Deprivation", copies: 2 },
    { cardName: "Peer Review", copies: 2 },
    { cardName: "Logical Fallacy", copies: 2 },
    { cardName: "Trick Question", copies: 1 },
    { cardName: "All-Night Study", copies: 1 },
    { cardName: "Lecture Time", copies: 1 },
    { cardName: "Data Breach", copies: 1 },
    { cardName: "Curveball", copies: 1 },
    { cardName: "Social Anxiety", copies: 1 },
    { cardName: "Campus Lab", copies: 1 },
    { cardName: "Debate Hall", copies: 1 },
    { cardName: "Library Basement", copies: 1 },
  ],
  "preps_starter": [
    { cardName: "Washed Varsity Legend", copies: 3 },
    { cardName: "Party Queen Bri", copies: 3 },
    { cardName: "Homecoming Committee", copies: 3 },
    { cardName: "Corporate Ladder Chad", copies: 3 },
    { cardName: "Influencer Couple", copies: 3 },
    { cardName: "Senior Party", copies: 2 },
    { cardName: "Networking Event", copies: 2 },
    { cardName: "Sponsorship Deal", copies: 2 },
    { cardName: "Dress Code Violation", copies: 2 },
    { cardName: "Rumor Mill", copies: 2 },
    { cardName: "Study Abroad", copies: 2 },
    { cardName: "Fundraiser", copies: 2 },
    { cardName: "Social Media Blitz", copies: 2 },
    { cardName: "Probation", copies: 1 },
    { cardName: "Screenshots Leaked", copies: 1 },
    { cardName: "Parent-Teacher Conference", copies: 1 },
    { cardName: "Disciplinary Action", copies: 1 },
    { cardName: "Surprise Quiz", copies: 1 },
    { cardName: "Slander", copies: 1 },
    { cardName: "Class Reunion", copies: 1 },
    { cardName: "Corporate Happy Hour", copies: 1 },
    { cardName: "College Campus", copies: 1 },
  ],
};
