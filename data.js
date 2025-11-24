window.services = {
  // =================================================================
  // 1. PRINTING: Structure à 3 niveaux (Type/Color -> Format/Size)
  // =================================================================
  'Print': {
    'B/W': {
      'A4': [
        { min: 1, prix: 0.20 },
        { min: 10, prix: 0.15 },
        { min: 25, prix: 0.125 },
        { min: 50, prix: 0.10 },
        { min: 100, prix: 0.09 },
        { min: 250, prix: 0.08 },
        { min: 500, prix: 0.07 },
        { min: 750, prix: 0.06 },
        { min: 1000, prix: 0.05 },
        { min: 2500, prix: 0.04 },
        { min: 5000, prix: 0.03 },
        { min: 7500, prix: 0.028 },
        { min: 10000, prix: 0.026 },
        { min: Infinity, prix: 0.024 }
      ],
      'A3': [
        { min: 1, prix: 0.40 },
        { min: 10, prix: 0.30 },
        { min: 25, prix: 0.25 },
        { min: 50, prix: 0.20 },
        { min: 100, prix: 0.18 },
        { min: 250, prix: 0.16 },
        { min: 500, prix: 0.14 },
        { min: 750, prix: 0.12 },
        { min: 1000, prix: 0.10 },
        { min: 2500, prix: 0.08 },
        { min: 5000, prix: 0.06 },
        { min: 7500, prix: 0.056 },
        { min: 10000, prix: 0.052 },
        { min: Infinity, prix: 0.048 }
      ],
      // A5 : Min doublés (x2), Prix divisés par 2
      'A5': [
        { min: 1, prix: 0.10 },
        { min: 20, prix: 0.075 },
        { min: 50, prix: 0.0625 },
        { min: 100, prix: 0.05 },
        { min: 200, prix: 0.045 },
        { min: 500, prix: 0.04 },
        { min: 1000, prix: 0.035 },
        { min: 1500, prix: 0.03 },
        { min: 2000, prix: 0.025 },
        { min: 5000, prix: 0.02 },
        { min: 10000, prix: 0.015 },
        { min: 15000, prix: 0.014 },
        { min: 20000, prix: 0.013 },
        { min: Infinity, prix: 0.012 }
      ],
      // A6 : Min quadruplés (x4), Prix divisés par 4
      'A6': [
        { min: 1, prix: 0.05 },
        { min: 40, prix: 0.0375 },
        { min: 100, prix: 0.03125 },
        { min: 200, prix: 0.025 },
        { min: 400, prix: 0.0225 },
        { min: 1000, prix: 0.02 },
        { min: 2000, prix: 0.0175 },
        { min: 3000, prix: 0.015 },
        { min: 4000, prix: 0.0125 },
        { min: 10000, prix: 0.01 },
        { min: 20000, prix: 0.0075 },
        { min: 30000, prix: 0.007 },
        { min: 40000, prix: 0.0065 },
        { min: Infinity, prix: 0.006 }
      ]
    },
    'Color': {
      'A4': [
        { min: 1, prix: 0.45 },
        { min: 10, prix: 0.40 },
        { min: 25, prix: 0.36 },
        { min: 50, prix: 0.32 },
        { min: 100, prix: 0.28 },
        { min: 250, prix: 0.24 },
        { min: 500, prix: 0.20 },
        { min: 750, prix: 0.16 },
        { min: 1000, prix: 0.12 },
        { min: 2500, prix: 0.10 },
        { min: 5000, prix: 0.09 },
        { min: 7500, prix: 0.08 },
        { min: 10000, prix: 0.07 },
        { min: Infinity, prix: 0.06 }
      ],
      'A3': [
        { min: 1, prix: 0.90 },
        { min: 10, prix: 0.80 },
        { min: 25, prix: 0.72 },
        { min: 50, prix: 0.64 },
        { min: 100, prix: 0.56 },
        { min: 250, prix: 0.48 },
        { min: 500, prix: 0.40 },
        { min: 750, prix: 0.32 },
        { min: 1000, prix: 0.24 },
        { min: 2500, prix: 0.20 },
        { min: 5000, prix: 0.18 },
        { min: 7500, prix: 0.16 },
        { min: 10000, prix: 0.14 },
        { min: Infinity, prix: 0.12 }
      ],
      // A5 Color : Min x2, Prix /2
      'A5': [
        { min: 1, prix: 0.225 },
        { min: 20, prix: 0.20 },
        { min: 50, prix: 0.18 },
        { min: 100, prix: 0.16 },
        { min: 200, prix: 0.14 },
        { min: 500, prix: 0.12 },
        { min: 1000, prix: 0.10 },
        { min: 1500, prix: 0.08 },
        { min: 2000, prix: 0.06 },
        { min: 5000, prix: 0.05 },
        { min: 10000, prix: 0.045 },
        { min: 15000, prix: 0.04 },
        { min: 20000, prix: 0.035 },
        { min: Infinity, prix: 0.03 }
      ],
      // A6 Color : Min x4, Prix /4
      'A6': [
        { min: 1, prix: 0.1125 },
        { min: 40, prix: 0.10 },
        { min: 100, prix: 0.09 },
        { min: 200, prix: 0.08 },
        { min: 400, prix: 0.07 },
        { min: 1000, prix: 0.06 },
        { min: 2000, prix: 0.05 },
        { min: 3000, prix: 0.04 },
        { min: 4000, prix: 0.03 },
        { min: 10000, prix: 0.025 },
        { min: 20000, prix: 0.0225 },
        { min: 30000, prix: 0.02 },
        { min: 40000, prix: 0.0175 },
        { min: Infinity, prix: 0.015 }
      ]
    }
  },


  // =================================================================
  // 2. PAPER: Structure à 3 niveaux (Poids/Type -> Format/Size)
  // =================================================================
  'Paper': {
    '100g': {
      'A3+': [{ max: Infinity, prix: 0.100 }], // PRIX LIBRE (vous le remplirez manuellement)
      'A3': [{ max: Infinity, prix: 0.050 }],
      'A4+': [{ max: Infinity, prix: 0.050 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.025 }],
      'A5+': [{ max: Infinity, prix: 0.025 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.0125 }],
      'A6+': [{ max: Infinity, prix: 0.0125 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.00625 }]
    },
    '120g': {
      'A3+': [{ max: Infinity, prix: 0.100 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.060 }],
      'A4+': [{ max: Infinity, prix: 0.060 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.030 }],
      'A5+': [{ max: Infinity, prix: 0.030 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.015 }],
      'A6+': [{ max: Infinity, prix: 0.015 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.0075 }]
    },
    '160g': {
      'A3+': [{ max: Infinity, prix: 0.200 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.160 }],
      'A4+': [{ max: Infinity, prix: 0.160 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.080 }],
      'A5+': [{ max: Infinity, prix: 0.080 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.040 }],
      'A6+': [{ max: Infinity, prix: 0.040 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.020 }]
    },
    '200g': {
      'A3+': [{ max: Infinity, prix: 0.350 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.300 }],
      'A4+': [{ max: Infinity, prix: 0.300 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.150 }],
      'A5+': [{ max: Infinity, prix: 0.150 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.075 }],
      'A6+': [{ max: Infinity, prix: 0.075 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.0375 }]
    },
    '300g': {
      'A3+': [{ max: Infinity, prix: 0.450 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.400 }],
      'A4+': [{ max: Infinity, prix: 0.400 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.200 }],
      'A5+': [{ max: Infinity, prix: 0.200 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.100 }],
      'A6+': [{ max: Infinity, prix: 0.100 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.050 }]
    },
    '350g': {
      'A3+': [{ max: Infinity, prix: 0.550 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.500 }],
      'A4+': [{ max: Infinity, prix: 0.500 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.250 }],
      'A5+': [{ max: Infinity, prix: 0.250 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.125 }],
      'A6+': [{ max: Infinity, prix: 0.125 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.0625 }]
    },
    'Gloss 135g': {
      'A3+': [{ max: Infinity, prix: 0.550 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.500 }],
      'A4+': [{ max: Infinity, prix: 0.500 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.250 }],
      'A5+': [{ max: Infinity, prix: 0.250 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.125 }],
      'A6+': [{ max: Infinity, prix: 0.125 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.0625 }]
    },
    'Gloss 200g': {
      'A3+': [{ max: Infinity, prix: 0.650 }], // PRIX LIBRE
      'A3': [{ max: Infinity, prix: 0.600 }],
      'A4+': [{ max: Infinity, prix: 0.600 }],  // Prix A3
      'A4': [{ max: Infinity, prix: 0.300 }],
      'A5+': [{ max: Infinity, prix: 0.300 }],  // Prix A3 / 2
      'A5': [{ max: Infinity, prix: 0.150 }],
      'A6+': [{ max: Infinity, prix: 0.150 }], // Prix A3 / 4
      'A6': [{ max: Infinity, prix: 0.075 }]
    }
  },

  // =================================================================
  // 3. FINISHING: Structure à 2 niveaux
  // =================================================================
  'Finishing': {
    'Booklet A4': [{ max: Infinity, prix: 0.02, mint: 6.5 }],
    'Booklet A3': [{ max: Infinity, prix: 0.03, mint: 6.5 }],
    'Booklet + cut A4': [{ max: Infinity, prix: 0.025, mint: 6.5 }],
    'Booklet + cut A3': [{ max: Infinity, prix: 0.035, mint: 6.5 }],
    'Folding 2 & 3 A4': [{ max: Infinity, prix: 0.0125, mint: 6.5 }],
    'Folding 2 & 3 A3': [{ max: Infinity, prix: 0.025, mint: 6.5 }],
    'Pre Folds': [{ max: Infinity, prix: 0.15, mint: 6.5 }],
    'Cut': [{ max: Infinity, prix: 0.0025, mint: 3.5 }],
    'Perfo': [{ max: Infinity, prix: 0.0025, mint: 3.5 }],
    'Imposing': [{ max: Infinity, prix: 5 , }],
    'Staple': [{ max: Infinity, prix: 0.5 }]
  },

  // =================================================================
  // 4. LAMINATION: Structure à 2 niveaux
  // =================================================================
  'Lamination': {
    'A5': [
      { min: 1, prix: 1},
      { min: 10, prix: 0.85},
      { min: 25, prix: 0.75},
    ],
    'A4': [
      { min: 1, prix: 1.25},
      { min: 10, prix: 1},
      { min: 25, prix: 0.85},
    ],
    'A3': [
      { min: 1, prix: 2.5},
      { min: 10, prix: 2},
      { min: 25, prix: 1.7},
    ],
    'A2': [
      { min: 1, prix: 5},
      { min: 10, prix: 4.5},
      { min: 25, prix: 4},
    ],
    'A1': [
      { min: 1, prix: 9.5},
      { min: 10, prix: 8.5},
      { min: 25, prix: 7.5},
    ],
    'A0': [
      { min: 1, prix: 18.5},
      { min: 10, prix: 16.5},
      { min: 25, prix: 14.5},
    ]
  },

  // =================================================================
  // 5. PLAN: Structure à 3 niveaux (Type/Color -> Format/Size)
  // =================================================================
  'Plan': {
    'B/W': {
        'A2': [
            { min: 1, prix: 1.2},
            { min: 10, prix: 0.95},
            { min: 25, prix: 0.80},
            { min: 50, prix: 0.70}
        ],
        'A1': [
            { min: 1, prix: 2.4},
            { min: 10, prix: 1.9},
            { min: 25, prix: 1.6},
            { min: 50, prix: 1.4}
        ],
        'A0': [
            { min: 1, prix: 4.8},
            { min: 10, prix: 3.8},
            { min: 25, prix: 3.2},
            { min: 50, prix: 2.8}
        ]
    },
    'Color': {
        'A2': [
            { min: 1, prix: 4.8},
            { min: 10, prix: 3.8},
            { min: 25, prix: 3.2},
            { min: 50, prix: 2.8}
        ],
        'A1': [
            { min: 1, prix: 9.6},
            { min: 10, prix: 7.6},
            { min: 25, prix: 6.4},
            { min: 50, prix: 5.6}
        ],
        'A0': [
            { min: 1, prix: 19.2},
            { min: 10, prix: 15.2},
            { min: 25, prix: 12.8},
            { min: 50, prix: 11}
        ]
    },
    'Fold': [
        {prix: 0.6 }
    ]
  },

  // =================================================================
  // 6. BIG SIZE: Structure à 3 niveaux (Type/Matériau -> Format/Size)
  // =================================================================
  'Big size': {
    'Mat': {
        'A2': [
            { min: 1, prix: 9},
            { min: 10, prix: 8},
            { min: 25, prix: 7.5},
            { min: 50, prix: 7}
        ],
        'A1': [
            { min: 1, prix: 14},
            { min: 10, prix: 12},
            { min: 25, prix: 11},
            { min: 50, prix: 10}
        ],
        'A0': [
            { min: 1, prix: 24},
            { min: 10, prix: 20},
            { min: 25, prix: 18},
            { min: 50, prix: 16}
        ]
    },
    'Gloss': {
        'A2': [
            { min: 1, prix: 12},
            { min: 10, prix: 11},
            { min: 25, prix: 10.5},
            { min: 50, prix: 10}
        ],
        'A1': [
            { min: 1, prix: 17},
            { min: 10, prix: 15},
            { min: 25, prix: 14},
            { min: 50, prix: 13}
        ],
        'A0': [
            { min: 1, prix: 27},
            { min: 10, prix: 23},
            { min: 25, prix: 20.5},
            { min: 50, prix: 19}
        ]
    }
  },

  // =================================================================
  // 6. binding: Structure à 3 niveaux (Type/Matériau -> Format/Size)
  // =================================================================
  'Binding': {
    'Smale': {
        'Simple': [
            { min: 1, prix: 1.25},
            { min: 20, prix: 1.15},
            { min: 50, prix: 1},
            { min: 100, prix: 0.9}
        ],
        'Plastic': [
            { min: 1, prix: 1.85},
            { min: 20, prix: 1.75},
            { min: 50, prix: 1.6},
            { min: 100, prix: 1.5}
        ]
    },
    'Medium': {
        'Simple': [
            { min: 1, prix: 2},
            { min: 20, prix: 1.9},
            { min: 50, prix: 1.8},
            { min: 100, prix: 1.65}
        ],
        'Plastic': [
            { min: 1, prix: 2.6},
            { min: 20, prix: 2.5},
            { min: 50, prix: 2.4},
            { min: 100, prix: 2.25}
        ]
    },
    'Large': {
        'Simple': [
            { min: 1, prix: 2.5},
            { min: 20, prix: 2.4},
            { min: 50, prix: 2.25},
            { min: 100, prix: 2.15}
        ],
        'Plastic': [
            { min: 1, prix: 3.1},
            { min: 20, prix: 3},
            { min: 50, prix: 2.85},
            { min: 100, prix: 2.75}
        ]
    }
  },


  // =================================================================
  // 7. SPECIAL: Structure à 2 niveaux
  // =================================================================
  'Special':{
    'CDV':[
      { min: 1, prix: 0.14,mint: 14},
      { min: 101, prix: 0.135,mint: 27},
      { min: 201, prix: 0.12,mint: 36},
      { min: 301, prix: 0.1125,mint: 45},
      { min: 401, prix: 0.11,mint: 55}
    ]
  }
};