#include "GameManager.h"
#include <cmath>
#include <cstdlib>
#include <algorithm>

GameManager::GameManager() : player(100.0f, GROUND_Y - 60.0f, 40.0f, 60.0f) {
    init();
}

GameManager::~GameManager() {
    for (auto* e : entities) {
        delete e;
    }
    entities.clear();
}

void GameManager::init() {
    // Standard cleanup of any active items on restart
    for (auto* e : entities) {
        delete e;
    }
    entities.clear();

    buffManager.clearAll();

    baseGameSpeed = 360.0f;
    gameSpeed = baseGameSpeed;
    maxGameSpeed = 1100.0f;
    speedMultiplier = 1.0f;

    score = 0;
    scoreAccumulator = 0.0f;
    distanceTravelled = 0.0f;
    gameOverState = false;

    spawnTimer = 0.0f;
    nextSpawnInterval = 1.4f;
    lastMilestoneReached = 0;

    isJumpKeyPressed = false;
    isDuckKeyPressed = false;

    player.reset();
    player.setY(GROUND_Y - player.getHeight());
}

void GameManager::update(float dt) {
    if (gameOverState) return;

    // 1. Progress distance and game-wide pacing
    distanceTravelled += gameSpeed * dt;
    gameSpeed = baseGameSpeed + (distanceTravelled * 0.008f);
    if (gameSpeed > maxGameSpeed) {
        gameSpeed = maxGameSpeed;
    }

    // 2. Score Bleed Debuff handling
    if (buffManager.isDebuffActive(DebuffType::SCORE_BLEED)) {
        scoreAccumulator -= 20.0f * dt;
        if (scoreAccumulator < 0.0f) {
            scoreAccumulator = 0.0f;
        }
    }

    // 3. Score Accumulation (Double score speed with SCORE_X2)
    float baseScoreRate = (gameSpeed * 0.05f);
    float multiplier = buffManager.isBuffActive(BuffType::SCORE_X2) ? 2.0f : 1.0f;
    scoreAccumulator += baseScoreRate * multiplier * dt;
    score = static_cast<int>(scoreAccumulator);

    // 4. Milestone Checking (Every 1,000 points spawn high tier items)
    int currentMilestone = score / 1000;
    if (currentMilestone > lastMilestoneReached) {
        lastMilestoneReached = currentMilestone;
        // Spawn special legendary collector buff directly ahead
        float spawnX = CANVAS_WIDTH + 150.0f;
        float spawnY = 220.0f;
        // Alternate between Double Jump, Magnet, and Glide items at milestones
        int highTierBuffId = lastMilestoneReached % 3; 
        BuffType spawnedBuff = BuffType::DOUBLE_JUMP;
        if (highTierBuffId == 1) spawnedBuff = BuffType::MAGNET;
        else if (highTierBuffId == 2) spawnedBuff = BuffType::GLIDE;

        Entity* specialCollectible = new Entity(spawnX, spawnY, 32.0f, 32.0f, EntityType::BUFF, static_cast<int>(spawnedBuff));
        specialCollectible->setVx(-gameSpeed);
        entities.push_back(specialCollectible);
    }

    // 5. Tick buffs/debuffs durations
    buffManager.update(dt);

    // 6. Update Player sizes depending on active buffs (e.g. Mini-Size)
    bool isMini = buffManager.isBuffActive(BuffType::MINI_SIZE);
    
    // Inverted controls flips jumping/ducking flags - handled standardly by inputs,
    // but in case keys are continually pressed, they are handled at binding layer.
    player.setDucking(isDuckKeyPressed, isMini);

    // 7. Gravity Physics processing on player
    float gravityFactor = 1.0f;
    if (buffManager.isDebuffActive(DebuffType::HEAVY_GRAVITY)) {
        gravityFactor = 2.0f; // Gravitational pull doubled!
    } else if (buffManager.isBuffActive(BuffType::GLIDE) && isJumpKeyPressed && player.getVy() > 0.0f) {
        gravityFactor = 0.25f; // Gliding cuts gravity fall velocity significantly
    }

    float currentGravity = 1750.0f * gravityFactor;
    player.setVy(player.getVy() + currentGravity * dt);
    
    // Update player coords
    player.update(dt);

    // Ground collision lock
    float groundLevel = GROUND_Y - player.getHeight();
    if (player.getY() >= groundLevel) {
        player.setY(groundLevel);
        player.setVy(0.0f);
        player.setGrounded(true);
        // Reset double jump or single jump counts
        player.setJumpsRemaining(buffManager.isBuffActive(BuffType::DOUBLE_JUMP) ? 2 : 1);
    } else {
        player.setGrounded(false);
    }

    // 8. Update active obstacles / items
    bool magnetEnabled = buffManager.isBuffActive(BuffType::MAGNET);

    for (auto* e : entities) {
        if (!e->isActive()) continue;

        // Apply standard speed matching to stay stationary on ground movement
        e->setVx(-gameSpeed);

        // Magnetic Attraction mechanic
        if (magnetEnabled && (e->getType() == EntityType::BUFF || e->getType() == EntityType::DEBUFF)) {
            float dx = (player.getX() + player.getWidth() / 2.0f) - (e->getX() + e->getWidth() / 2.0f);
            float dy = (player.getY() + player.getHeight() / 2.0f) - (e->getY() + e->getHeight() / 2.0f);
            float dist = std::sqrt(dx * dx + dy * dy);

            // Attract within 260 unit radius
            if (dist < 265.0f && dist > 5.0f) {
                float pullStrength = 550.0f;
                // Add magnet vector impulse
                e->setVx(-gameSpeed + (dx / dist) * pullStrength);
                e->setVy((dy / dist) * pullStrength);
            }
        }

        e->update(dt);

        // If off screen, disable
        if (e->getX() + e->getWidth() < -100.0f) {
            e->setActive(false);
        }
    }

    // 9. Entity collision processing
    for (auto* e : entities) {
        if (!e->isActive()) continue;

        if (player.checkCollision(*e)) {
            if (e->getType() == EntityType::OBSTACLE) {
                triggerObstacleCollision(e);
            } else if (e->getType() == EntityType::BUFF) {
                triggerBuffCollision(static_cast<BuffType>(e->getSubtype()));
                e->setActive(false);
            } else if (e->getType() == EntityType::DEBUFF) {
                triggerDebuffCollision(static_cast<DebuffType>(e->getSubtype()));
                e->setActive(false);
            }
        }
    }

    // Free retired objects
    cleanUpInactiveEntities();

    // 10. Entity spawning pipeline
    spawnTimer += dt;
    if (spawnTimer >= nextSpawnInterval) {
        spawnTimer = 0.0f;
        spawnEntity();
        
        // Randomize future spacing
        float minSpacing = std::max(0.9f, 1.8f - (gameSpeed * 0.001f));
        float maxSpacing = std::max(1.4f, 2.5f - (gameSpeed * 0.001f));
        nextSpawnInterval = minSpacing + static_cast<float>(std::rand()) / (static_cast<float>(RAND_MAX) / (maxSpacing - minSpacing));
    }
}

void GameManager::handleJumpPress(bool pressed) {
    isJumpKeyPressed = pressed;
    if (pressed) {
        // Handle inverted controls debuff if active
        if (buffManager.isDebuffActive(DebuffType::INVERTED_CONTROLS)) {
            // Jumps acts as Duck
            isDuckKeyPressed = true;
        } else {
            bool djump = buffManager.isBuffActive(BuffType::DOUBLE_JUMP);
            bool heavy = buffManager.isDebuffActive(DebuffType::HEAVY_GRAVITY);
            player.jump(djump, heavy);
        }
    } else {
        if (buffManager.isDebuffActive(DebuffType::INVERTED_CONTROLS)) {
            isDuckKeyPressed = false;
        }
    }
}

void GameManager::handleDuckPress(bool pressed) {
    if (buffManager.isDebuffActive(DebuffType::INVERTED_CONTROLS)) {
        // Duck acts as Jump
        if (pressed) {
            bool djump = buffManager.isBuffActive(BuffType::DOUBLE_JUMP);
            bool heavy = buffManager.isDebuffActive(DebuffType::HEAVY_GRAVITY);
            player.jump(djump, heavy);
            isJumpKeyPressed = true;
        } else {
            isJumpKeyPressed = false;
        }
    } else {
        isDuckKeyPressed = pressed;
    }
}

void GameManager::triggerObstacleCollision(Entity* obstacle) {
    // 1. Hallucinations have no static bounds collisions
    if (obstacle->getSubtype() == 9 || buffManager.isDebuffActive(DebuffType::HALLUCINATION)) {
        // Hallucination item - clean fade
        obstacle->setActive(false);
        return;
    }

    // 2. Consume shield positive buff
    if (buffManager.isBuffActive(BuffType::SHIELD)) {
        obstacle->setActive(false);
        buffManager.removeBuff(BuffType::SHIELD);
    } else {
        // Unshielded collision, Game Over
        gameOverState = true;
    }
}

void GameManager::triggerBuffCollision(BuffType type) {
    // Activating buff. Shield gets longer validity, others standard 8-seconder timer
    float duration = 8.5f;
    if (type == BuffType::SHIELD) {
        duration = 999.0f; // Permanent until popped
    }
    buffManager.activateBuff(type, duration);
}

void GameManager::triggerDebuffCollision(DebuffType type) {
    float duration = 7.0f;
    buffManager.activateDebuff(type, duration);
}

void GameManager::spawnEntity() {
    float randVal = static_cast<float>(std::rand()) / RAND_MAX;

    // Coordinate positions depending on obstacle spacing and type
    float spawnX = CANVAS_WIDTH + 100.0f;
    
    // Deciding Spawn Categories: ~55% Obstacles, ~25% Buffs, ~20% Debuffs
    if (randVal < 0.55f) {
        // Spawn OBSTACLE (ground rocks, double ground spikes, high fly birds, or fakes)
        int variety = std::rand() % 4; // 0: Small spikes (jump), 1: Tall block (double jump or jump), 2: Upper ledge bird (duck), 3: Hallucination spike
        
        float w = 32.0f;
        float h = 40.0f;
        float y = GROUND_Y - h;

        if (variety == 1) {
            w = 40.0f;
            h = 58.0f;
            y = GROUND_Y - h;
        } else if (variety == 2) {
            w = 36.0f;
            h = 28.0f;
            y = GROUND_Y - 85.0f; // Elevated bird flies at player facial height (duck)
        } else if (variety == 3) {
            // Fake spike - sets subtype as 9 (hallucinated with 0 impact)
            w = 30.0f;
            h = 32.0f;
            y = GROUND_Y - h;
            Entity* hallucinationObstacle = new Entity(spawnX, y, w, h, EntityType::OBSTACLE, 9);
            hallucinationObstacle->setVx(-gameSpeed);
            entities.push_back(hallucinationObstacle);
            return;
        }

        Entity* obstacle = new Entity(spawnX, y, w, h, EntityType::OBSTACLE, variety);
        obstacle->setVx(-gameSpeed);
        entities.push_back(obstacle);

    } else if (randVal < 0.80f) {
        // Spawn BUFF (Positive collectible)
        int buffSubtype = std::rand() % static_cast<int>(BuffType::COUNT);
        float itemY = GROUND_Y - 100.0f - (std::rand() % 80); // Floating altitude
        
        Entity* buffItem = new Entity(spawnX, itemY, 26.0f, 26.0f, EntityType::BUFF, buffSubtype);
        buffItem->setVx(-gameSpeed);
        entities.push_back(buffItem);

    } else {
        // Spawn DEBUFF (Negative collectible trap)
        int debuffSubtype = std::rand() % static_cast<int>(DebuffType::COUNT);
        float itemY = GROUND_Y - 110.0f - (std::rand() % 65); // Floating altitude
        
        Entity* debuffItem = new Entity(spawnX, itemY, 26.0f, 26.0f, EntityType::DEBUFF, debuffSubtype);
        debuffItem->setVx(-gameSpeed);
        entities.push_back(debuffItem);
    }
}

void GameManager::cleanUpInactiveEntities() {
    auto originalSize = entities.size();
    entities.erase(
        std::remove_if(entities.begin(), entities.end(), [](Entity* e) {
            if (!e->isActive()) {
                delete e;
                return true;
            }
            return false;
        }),
        entities.end()
    );
}

// ====================================================
// Rendering Info Binding Accessors
// ====================================================

int GameManager::getEntityType(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return -1;
    return static_cast<int>(entities[index]->getType());
}

int GameManager::getEntitySubtype(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return -1;
    return entities[index]->getSubtype();
}

float GameManager::getEntityX(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return 0.0f;
    return entities[index]->getX();
}

float GameManager::getEntityY(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return 0.0f;
    return entities[index]->getY();
}

float GameManager::getEntityWidth(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return 0.0f;
    return entities[index]->getWidth();
}

float GameManager::getEntityHeight(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return 0.0f;
    return entities[index]->getHeight();
}

bool GameManager::isEntityActive(int index) const {
    if (index < 0 || index >= static_cast<int>(entities.size())) return false;
    return entities[index]->isActive();
}
