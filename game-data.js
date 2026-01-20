// ============ DONNÉES DU JEU ============

const GAME_DATA = {
    systems: {
        teknolojia: {
            name: 'Teknôlôjia',
            color: 0x00ffff,
            words: [
                { mg: 'Solosaina', fr: 'Ordinateur', en: 'Computer' },
                { mg: 'Tranonkala', fr: 'Site web', en: 'Website' },
                { mg: 'Rindrambaiko', fr: 'Réseau social', en: 'Social network' },
                { mg: 'Tambajotram', fr: 'Internet', en: 'Internet' },
                { mg: 'Hafatra', fr: 'Message', en: 'Message' },
                { mg: 'Serivisy', fr: 'Service', en: 'Service' },
                { mg: 'Programa', fr: 'Programme', en: 'Program' },
                { mg: 'Fifandraisana', fr: 'Connexion', en: 'Connection' },
                { mg: 'Fandefasana', fr: 'Envoi', en: 'Sending' },
                { mg: 'Fotodrakotra', fr: 'Capture d\'écran', en: 'Screenshot' }
            ]
        },
        haikanto: {
            name: 'Haikanto',
            color: 0xff006e,
            words: [
                { mg: 'Hosodoko', fr: 'Photographie', en: 'Photography' },
                { mg: 'Sandrihazava', fr: 'Peinture', en: 'Painting' },
                { mg: 'Sarimihetsika', fr: 'Film', en: 'Movie' },
                { mg: 'Soratra', fr: 'Écriture', en: 'Writing' },
                { mg: 'Hira', fr: 'Chanson', en: 'Song' },
                { mg: 'Famoronana', fr: 'Création', en: 'Creation' },
                { mg: 'Zavakanto', fr: 'Œuvre d\'art', en: 'Artwork' },
                { mg: 'Bakitra', fr: 'Sculpture', en: 'Sculpture' },
                { mg: 'Endrika', fr: 'Design', en: 'Design' },
                { mg: 'Lovantsaina', fr: 'Culture', en: 'Culture' }
            ]
        },
        fanabeazana: {
            name: 'Fanabeazana',
            color: 0x8b5cf6,
            words: [
                { mg: 'Fianarana', fr: 'Apprentissage', en: 'Learning' },
                { mg: 'Fahalalana', fr: 'Connaissance', en: 'Knowledge' },
                { mg: 'Mpampianatra', fr: 'Enseignant', en: 'Teacher' },
                { mg: 'Mpianatra', fr: 'Étudiant', en: 'Student' },
                { mg: 'Boky', fr: 'Livre', en: 'Book' },
                { mg: 'Fandalinana', fr: 'Recherche', en: 'Research' },
                { mg: 'Fahaizana', fr: 'Compétence', en: 'Skill' },
                { mg: 'Fandraharana', fr: 'Programme', en: 'Curriculum' },
                { mg: 'Fandinihana', fr: 'Étude', en: 'Study' },
                { mg: 'Vokambolana', fr: 'Vocabulaire', en: 'Vocabulary' }
            ]
        },
        fandraharahana: {
            name: 'Fandraharahana',
            color: 0xfbbf24,
            words: [
                { mg: 'Varotra', fr: 'Commerce', en: 'Business' },
                { mg: 'Orinasa', fr: 'Entreprise', en: 'Company' },
                { mg: 'Vola', fr: 'Argent', en: 'Money' },
                { mg: 'Tombotsoa', fr: 'Profit', en: 'Profit' },
                { mg: 'Mpiara-miasa', fr: 'Collègue', en: 'Colleague' },
                { mg: 'Tanjona', fr: 'Objectif', en: 'Goal' },
                { mg: 'Paikady', fr: 'Stratégie', en: 'Strategy' },
                { mg: 'Fifampiraharahana', fr: 'Partenariat', en: 'Partnership' },
                { mg: 'Mpanjifa', fr: 'Client', en: 'Customer' },
                { mg: 'Fampitomboana', fr: 'Croissance', en: 'Growth' }
            ]
        },
        haitarika: {
            name: 'Haitarika',
            color: 0x10b981,
            words: [
                { mg: 'Mpitarika', fr: 'Leader', en: 'Leader' },
                { mg: 'Ekipa', fr: 'Équipe', en: 'Team' },
                { mg: 'Hevitra', fr: 'Vision', en: 'Vision' },
                { mg: 'Safidy', fr: 'Décision', en: 'Decision' },
                { mg: 'Fanoloran-kevitra', fr: 'Conseil', en: 'Advice' },
                { mg: 'Tantara', fr: 'Mission', en: 'Mission' },
                { mg: 'Fampivoarana', fr: 'Développement', en: 'Development' },
                { mg: 'Fiaraha-monina', fr: 'Communauté', en: 'Community' },
                { mg: 'Fampandrosoana', fr: 'Progrès', en: 'Progress' },
                { mg: 'Fitantanana', fr: 'Gestion', en: 'Management' }
            ]
        }
    },
    
    settings: {
        physics: {
            gravity: 0,
            friction: 0.95,
            maxSpeed: 0.3,
            acceleration: 0.05,
            collisionDamage: 10,
            asteroidCount: 60,
            asteroidSpeedMultiplier: 0.02
        },
        gameplay: {
            startTime: 75,
            timeBonus: 5,
            wordsPerLevel: 10,
            collectionRadius: 5,
            slowMotionThreshold: 3,
            slowMotionDuration: 2000
        },
        camera: {
            distance: 8,
            height: 3,
            smoothing: 0.1,
            mouseSensitivity: 0.005,
            minVertical: -Math.PI / 2 + 0.1,
            maxVertical: Math.PI / 2 - 0.1
        },
        boundaries: {
            x: 50,
            y: 30,
            z: 50,
            sunPosition: { x: 0, y: 0, z: 0 },
            sunRadius: 5,
            sunDangerRadius: 8
        }
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_DATA;
}
