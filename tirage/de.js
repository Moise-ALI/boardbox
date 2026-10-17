/* Physique de repos du dé 3D, isolée pour être testable (utilisée par ui.js).
   Un cube a 24 positions de repos : 6 faces possibles vers la caméra × 4 rotations de cette face.
   On cherche celle qui demande le PLUS PETIT mouvement depuis l'orientation actuelle,
   comme un vrai dé qui finit de rouler sur la face où il est déjà presque posé. */
window.DieMath = (function () {
  'use strict';

  /**
   * @param {THREE.Quaternion} current  orientation actuelle du dé
   * @param {object} THREE              la bibliothèque three.js
   * @returns {{ target: THREE.Quaternion, faceIndex: number }}
   *   target : orientation de repos à atteindre ; faceIndex : face (0..5, ordre des matériaux
   *   de BoxGeometry : +X, -X, +Y, -Y, +Z, -Z) qui se retrouve face à la caméra (+Z).
   */
  function restingOrientation(current, THREE) {
    const AXES = [
      new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
    ];
    const toCamera = new THREE.Vector3(0, 0, 1);

    // 1. La face la plus tournée vers la caméra : c'est le résultat du lancer
    let faceIndex = 0, bestZ = -Infinity, faceWorld = null;
    AXES.forEach((axis, i) => {
      const w = axis.clone().applyQuaternion(current);
      if (w.z > bestZ) { bestZ = w.z; faceIndex = i; faceWorld = w; }
    });

    // 2. Plus petite rotation qui amène cette face exactement face à la caméra (jamais > 55°)
    const align = new THREE.Quaternion().setFromUnitVectors(faceWorld.normalize(), toCamera);
    const aligned = align.multiply(current.clone()); // align ∘ current

    // 3. Redressement : la face tourne sur elle-même jusqu'au quart de tour le plus proche (jamais > 45°)
    //    On prend un axe du dé qui est maintenant dans le plan de l'écran et on l'arrondit à 0/90/180/270°.
    const inPlane = AXES.map(a => a.clone().applyQuaternion(aligned)).find(w => Math.abs(w.z) < 0.5);
    const angle = Math.atan2(inPlane.y, inPlane.x);
    const snapped = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
    const roll = new THREE.Quaternion().setFromAxisAngle(toCamera, snapped - angle);
    const target = roll.multiply(aligned); // roll ∘ align ∘ current

    return { target: target.normalize(), faceIndex };
  }

  /** Angle (en degrés) entre deux orientations : sert aux tests et au réglage. */
  function angleBetween(a, b) {
    return 2 * Math.acos(Math.min(1, Math.abs(a.dot(b)))) * 180 / Math.PI;
  }

  return { restingOrientation, angleBetween };
})();
