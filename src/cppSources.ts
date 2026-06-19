// cppSources.ts - Complete C++ & WebAssembly Source Repository for the UI Code Explorer

export interface SourceFile {
  name: string;
  path: string;
  lang: 'cpp' | 'h' | 'js';
  code: string;
}

export const CPP_SOURCES: SourceFile[] = [
  {
    name: "Entity.h",
    path: "include/Entity.h",
    lang: 'h',
    code: `#ifndef ENTITY_H
#define ENTITY_H

#include <string>

enum class EntityType {
    PLAYER,
    OBSTACLE,
    BUFF,
    DEBUFF,
    BULLET
};

class Entity {
protected:
    float x;
    float y;
    float width;
    float height;
    float vx;
    float vy;
    bool active;
    EntityType type;
    int subtype;

public:
    Entity(float x, float y, float w, float h, EntityType type, int subtype);
    virtual ~Entity() = default;

    virtual void update(float dt);
    virtual bool checkCollision(const Entity& other) const;

    // Physics Getters/Setters
    float getX() const { return x; }
    void setX(float newX) { x = newX; }
    float getY() const { return y; }
    void setY(float newY) { y = newY; }
    float getWidth() const { return width; }
    void setWidth(float w) { width = w; }
    float getHeight() const { return height; }
    void setHeight(float h) { height = h; }
    float getVx() const { return vx; }
    void setVx(float val) { vx = val; }
    float getVy() const { return vy; }
    void setVy(float val) { vy = val; }
    bool isActive() const { return active; }
    void setActive(bool val) { active = val; }
    EntityType getType() const { return type; }
    int getSubtype() const { return subtype; }
};

class Player : public Entity {
private:
    bool grounded;
    bool ducking;
    int jumpsRemaining;
    int maxJumps;
    float baseWidth;
    float baseHeight;

public:
    Player(float x, float y, float w, float h);
    void update(float dt) override;
    void jump(bool doubleJumpEnabled, bool heavyGravity);
    void setDucking(bool state, bool miniSize);
    void reset();

    bool isGrounded() const { return grounded; }
    void setGrounded(bool state) { grounded = state; }
    bool isDucking() const { return ducking; }
    int getJumpsRemaining() const { return jumpsRemaining; }
    void setJumpsRemaining(int count) { jumpsRemaining = count; }
    float getBaseWidth() const { return baseWidth; }
    float getBaseHeight() const { return baseHeight; }
};

#endif // ENTITY_H`
  },
  {
    name: "BuffManager.h",
    path: "include/BuffManager.h",
    lang: 'h',
    code: `#ifndef BUFFMANAGER_H
#define BUFFMANAGER_H

#include <vector>
#include <map>
#include <cstdint>

enum class BuffType {
    SHIELD = 0,
    SCORE_X2 = 1,
    DOUBLE_JUMP = 2,
    MINI_SIZE = 3,
    GLIDE = 4,
    MAGNET = 5,
    GUN = 6,
    COUNT = 7
};

enum class DebuffType {
    HEAVY_GRAVITY = 0,
    INVERTED_CONTROLS = 1,
    SANDSTORM = 2,
    HALLUCINATION = 3,
    SCORE_BLEED = 4,
    COUNT = 5
};

class BuffManager {
private:
    std::map<BuffType, float> buffTimers;
    std::map<DebuffType, float> debuffTimers;

public:
    BuffManager();
    void update(float dt);
    
    void activateBuff(BuffType type, float duration);
    bool isBuffActive(BuffType type) const;
    float getBuffRemaining(BuffType type) const;
    void removeBuff(BuffType type);

    void activateDebuff(DebuffType type, float duration);
    bool isDebuffActive(DebuffType type) const;
    float getDebuffRemaining(DebuffType type) const;
    void removeDebuff(DebuffType type);

    uint32_t getBuffBitmask() const;
    uint32_t getDebuffBitmask() const;
    void clearAll();
};

#endif // BUFFMANAGER_H`
  },
  {
    name: "GameManager.h",
    path: "include/GameManager.h",
    lang: 'h',
    code: `#ifndef GAMEMANAGER_H
#define GAMEMANAGER_H

#include <vector>
#include "Entity.h"
#include "BuffManager.h"

const float CANVAS_WIDTH = 1000.0f;
const float CANVAS_HEIGHT = 500.0f;
const float GROUND_Y = 400.0f;

class GameManager {
private:
    Player player;
    std::vector<Entity*> entities;
    BuffManager buffManager;

    float gameSpeed;
    float baseGameSpeed;
    float maxGameSpeed;
    float speedMultiplier;

    float score;
    float scoreAccumulator;
    float distanceTravelled;
    bool gameOverState;

    float spawnTimer;
    float nextSpawnInterval;
    int lastMilestoneReached;

    bool isJumpKeyPressed;
    bool isDuckKeyPressed;

    void spawnEntity();
    void cleanUpInactiveEntities();

public:
    GameManager();
    ~GameManager();

    void init();
    void update(float dt);

    void handleJumpPress(bool pressed);
    void handleDuckPress(bool pressed);
    void triggerObstacleCollision(Entity* obstacle);
    void triggerBuffCollision(BuffType type);
    void triggerDebuffCollision(DebuffType type);

    float getPlayerX() const { return player.getX(); }
    float getPlayerY() const { return player.getY(); }
    float getPlayerWidth() const { return player.getWidth(); }
    float getPlayerHeight() const { return player.getHeight(); }
    bool isPlayerDucking() const { return player.isDucking(); }

    int getScore() const { return static_cast<int>(score); }
    float getDistance() const { return distanceTravelled; }
    bool isGameOver() const { return gameOverState; }
    float getGameSpeed() const { return gameSpeed; }

    uint32_t getBuffsMask() const { return buffManager.getBuffBitmask(); }
    uint32_t getDebuffsMask() const { return buffManager.getDebuffBitmask(); }
    float getBuffRemainingTime(int type) const { return buffManager.getBuffRemaining(static_cast<BuffType>(type)); }
    float getDebuffRemainingTime(int type) const { return buffManager.getDebuffRemaining(static_cast<DebuffType>(type)); }

    int getEntityCount() const { return static_cast<int>(entities.size()); }
    int getEntityType(int index) const;
    int getEntitySubtype(int index) const;
    float getEntityX(int index) const;
    float getEntityY(int index) const;
    float getEntityWidth(int index) const;
    float getEntityHeight(int index) const;
    bool isEntityActive(int index) const;
};

#endif // GAMEMANAGER_H`
  },
  {
    name: "Entity.cpp",
    path: "src/Entity.cpp",
    lang: 'cpp',
    code: `#include "Entity.h"

Entity::Entity(float x, float y, float w, float h, EntityType type, int subtype)
    : x(x), y(y), width(w), height(h), vx(0.0f), vy(0.0f), active(true), type(type), subtype(subtype) {}

void Entity::update(float dt) {
    x += vx * dt;
    y += vy * dt;
}

bool Entity::checkCollision(const Entity& other) const {
    if (!active || !other.isActive()) return false;
    return (x < other.x + other.width &&
            x + width > other.x &&
            y < other.y + other.height &&
            y + height > other.y);
}

Player::Player(float x, float y, float w, float h)
    : Entity(x, y, w, h, EntityType::PLAYER, 0),
      grounded(true), ducking(false), jumpsRemaining(1), maxJumps(1),
      baseWidth(w), baseHeight(h) {}

void Player::update(float dt) {
    x += vx * dt;
    y += vy * dt;
}

void Player::jump(bool doubleJumpEnabled, bool heavyGravity) {
    maxJumps = doubleJumpEnabled ? 2 : 1;
    if (grounded) {
        vy = heavyGravity ? -680.0f : -650.0f;
        grounded = false;
        jumpsRemaining = maxJumps - 1;
    } else if (doubleJumpEnabled && jumpsRemaining > 0) {
        vy = -550.0f;
        jumpsRemaining--;
    }
}

void Player::setDucking(bool state, bool miniSize) {
    ducking = state;
    float targetHeight = baseHeight;
    float targetWidth = baseWidth;
    if (miniSize) {
        targetHeight *= 0.5f;
        targetWidth *= 0.5f;
    }
    if (ducking) {
        width = targetWidth * 1.3f;
        height = targetHeight * 0.5f;
    } else {
        width = targetWidth;
        height = targetHeight;
    }
}

void Player::reset() {
    vy = 0.0f;
    vx = 0.0f;
    grounded = true;
    ducking = false;
    jumpsRemaining = 1;
    maxJumps = 1;
    width = baseWidth;
    height = baseHeight;
}`
  },
  {
    name: "BuffManager.cpp",
    path: "src/BuffManager.cpp",
    lang: 'cpp',
    code: `#include "BuffManager.h"

BuffManager::BuffManager() {
    clearAll();
}

void BuffManager::update(float dt) {
    for (int i = 0; i < static_cast<int>(BuffType::COUNT); ++i) {
        BuffType type = static_cast<BuffType>(i);
        if (buffTimers[type] > 0.0f) {
            buffTimers[type] -= dt;
            if (buffTimers[type] < 0.0f) buffTimers[type] = 0.0f;
        }
    }
    for (int i = 0; i < static_cast<int>(DebuffType::COUNT); ++i) {
        DebuffType type = static_cast<DebuffType>(i);
        if (debuffTimers[type] > 0.0f) {
            debuffTimers[type] -= dt;
            if (debuffTimers[type] < 0.0f) debuffTimers[type] = 0.0f;
        }
    }
}

void BuffManager::activateBuff(BuffType type, float duration) {
    buffTimers[type] = duration;
}

bool BuffManager::isBuffActive(BuffType type) const {
    auto it = buffTimers.find(type);
    return it != buffTimers.end() && it->second > 0.0f;
}

float BuffManager::getBuffRemaining(BuffType type) const {
    auto it = buffTimers.find(type);
    return it != buffTimers.end() ? it->second : 0.0f;
}

void BuffManager::removeBuff(BuffType type) {
    buffTimers[type] = 0.0f;
}

void BuffManager::activateDebuff(DebuffType type, float duration) {
    debuffTimers[type] = duration;
}

bool BuffManager::isDebuffActive(DebuffType type) const {
    auto it = debuffTimers.find(type);
    return it != debuffTimers.end() && it->second > 0.0f;
}

float BuffManager::getDebuffRemaining(DebuffType type) const {
    auto it = debuffTimers.find(type);
    return it != debuffTimers.end() ? it->second : 0.0f;
}

void BuffManager::removeDebuff(DebuffType type) {
    debuffTimers[type] = 0.0f;
}

uint32_t BuffManager::getBuffBitmask() const {
    uint32_t mask = 0;
    for (int i = 0; i < static_cast<int>(BuffType::COUNT); ++i) {
        if (isBuffActive(static_cast<BuffType>(i))) mask |= (1 << i);
    }
    return mask;
}

uint32_t BuffManager::getDebuffBitmask() const {
    uint32_t mask = 0;
    for (int i = 0; i < static_cast<int>(DebuffType::COUNT); ++i) {
        if (isDebuffActive(static_cast<DebuffType>(i))) mask |= (1 << i);
    }
    return mask;
}

void BuffManager::clearAll() {
    for (int i = 0; i < static_cast<int>(BuffType::COUNT); ++i) {
        buffTimers[static_cast<BuffType>(i)] = 0.0f;
    }
    for (int i = 0; i < static_cast<int>(DebuffType::COUNT); ++i) {
        debuffTimers[static_cast<DebuffType>(i)] = 0.0f;
    }
}`
  },
  {
    name: "GameManager.cpp",
    path: "src/GameManager.cpp",
    lang: 'cpp',
    code: `#include "GameManager.h"
#include <cmath>
#include <cstdlib>
#include <algorithm>

GameManager::GameManager() : player(100.0f, GROUND_Y - 60.0f, 40.0f, 60.0f) {
    init();
}

GameManager::~GameManager() {
    for (auto* e : entities) delete e;
    entities.clear();
}

void GameManager::init() {
    for (auto* e : entities) delete e;
    entities.clear();
    buffManager.clearAll();

    baseGameSpeed = 360.0f;
    gameSpeed = baseGameSpeed;
    maxGameSpeed = 1100.0f;
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

    distanceTravelled += gameSpeed * dt;
    gameSpeed = std::min(maxGameSpeed, baseGameSpeed + (distanceTravelled * 0.008f));

    if (buffManager.isDebuffActive(DebuffType::SCORE_BLEED)) {
        scoreAccumulator = std::max(0.0f, scoreAccumulator - 20.0f * dt);
    }

    float mult = buffManager.isBuffActive(BuffType::SCORE_X2) ? 2.0f : 1.0f;
    scoreAccumulator += (gameSpeed * 0.05f) * mult * dt;
    score = static_cast<int>(scoreAccumulator);

    // Milestones check
    int currentMilestone = score / 1000;
    if (currentMilestone > lastMilestoneReached) {
        lastMilestoneReached = currentMilestone;
        float bType = lastMilestoneReached % 3 === 1 ? 5 : (lastMilestoneReached % 3 === 2 ? 4 : 2);
        Entity* spec = new Entity(CANVAS_WIDTH + 150.0f, 220.0f, 32.0f, 32.0f, EntityType::BUFF, bType);
        spec->setVx(-gameSpeed);
        entities.push_back(spec);
    }

    buffManager.update(dt);
    player.setDucking(isDuckKeyPressed, buffManager.isBuffActive(BuffType::MINI_SIZE));

    float gravityFactor = 1.0f;
    if (buffManager.isDebuffActive(DebuffType::HEAVY_GRAVITY)) {
        gravityFactor = 2.0f;
    } else if (buffManager.isBuffActive(BuffType::GLIDE) && isJumpKeyPressed && player.getVy() > 0.0f) {
        gravityFactor = 0.25f;
    }

    player.setVy(player.getVy() + 1750.0f * gravityFactor * dt);
    player.update(dt);

    float groundLevel = GROUND_Y - player.getHeight();
    if (player.getY() >= groundLevel) {
        player.setY(groundLevel);
        player.setVy(0.0f);
        player.setGrounded(true);
        player.setJumpsRemaining(buffManager.isBuffActive(BuffType::DOUBLE_JUMP) ? 2 : 1);
    } else {
        player.setGrounded(false);
    }

    bool magnet = buffManager.isBuffActive(BuffType::MAGNET);
    for (auto* e : entities) {
        e->setVx(-gameSpeed);
        if (magnet && (e->getType() == EntityType::BUFF || e->getType() == EntityType::DEBUFF)) {
            float dx = (player.getX() + player.getWidth()/2) - (e->getX() + e->getWidth()/2);
            float dy = (player.getY() + player.getHeight()/2) - (e->getY() + e->getHeight()/2);
            float d = std::sqrt(dx*dx + dy*dy);
            if (d < 265.0f && d > 5.0f) {
                e->setVx(-gameSpeed + (dx/d)*550.0f);
                e->setVy((dy/d)*550.0f);
            }
        }
        e->update(dt);
        if (e->getX() + e->getWidth() < -100.0f) e->setActive(false);
    }

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

    cleanUpInactiveEntities();

    spawnTimer += dt;
    if (spawnTimer >= nextSpawnInterval) {
        spawnTimer = 0.0f;
        spawnEntity();
        float minSp = std::max(0.9f, 1.8f - (gameSpeed * 0.001f));
        float maxSp = std::max(1.4f, 2.5f - (gameSpeed * 0.001f));
        nextSpawnInterval = minSp + static_cast<float>(std::rand())/(static_cast<float>(RAND_MAX)/(maxSp-minSp));
    }
}

void GameManager::triggerObstacleCollision(Entity* obstacle) {
    if (obstacle->getSubtype() == 9 || buffManager.isDebuffActive(DebuffType::HALLUCINATION)) {
        obstacle->setActive(false);
        return;
    }
    if (buffManager.isBuffActive(BuffType::SHIELD)) {
        obstacle->setActive(false);
        buffManager.removeBuff(BuffType::SHIELD);
    } else {
        gameOverState = true;
    }
}

void GameManager::triggerBuffCollision(BuffType type) {
    buffManager.activateBuff(type, type == BuffType::SHIELD ? 999.0f : 8.5f);
}

void GameManager::triggerDebuffCollision(DebuffType type) {
    buffManager.activateDebuff(type, 7.0f);
}

void GameManager::spawnEntity() {
    float roll = static_cast<float>(std::rand()) / RAND_MAX;
    float spawnX = CANVAS_WIDTH + 100.0f;
    if (roll < 0.55f) {
        int var = std::rand() % 4;
        float w = 32.0f, h = 40.0f, y = GROUND_Y - h;
        if (var == 1) { w = 40.0f; h = 58.0f; y = GROUND_Y - h; }
        else if (var == 2) { w = 36.0f; h = 28.0f; y = GROUND_Y - 85.0f; }
        else if (var == 3) {
            Entity* spec = new Entity(spawnX, GROUND_Y - 32.0f, 30.0f, 32.0f, EntityType::OBSTACLE, 9);
            spec->setVx(-gameSpeed); entities.push_back(spec); return;
        }
        Entity* obs = new Entity(spawnX, y, w, h, EntityType::OBSTACLE, var);
        obs->setVx(-gameSpeed); entities.push_back(obs);
    } else if (roll < 0.80f) {
        int sub = std::rand() % static_cast<int>(BuffType::COUNT);
        Entity* item = new Entity(spawnX, GROUND_Y - 100.0f - (std::rand()%80), 26.0f, 26.0f, EntityType::BUFF, sub);
        item->setVx(-gameSpeed); entities.push_back(item);
    } else {
        int sub = std::rand() % static_cast<int>(DebuffType::COUNT);
        Entity* item = new Entity(spawnX, GROUND_Y - 110.0f - (std::rand()%65), 26.0f, 26.0f, EntityType::DEBUFF, sub);
        item->setVx(-gameSpeed); entities.push_back(item);
    }
}

void GameManager::cleanUpInactiveEntities() {
    entities.erase(std::remove_if(entities.begin(), entities.end(), [](Entity* e) {
        if (!e->isActive()) { delete e; return true; } return false;
    }), entities.end());
}

int GameManager::getEntityType(int index) const { return index >= 0 && index < entities.size() ? static_cast<int>(entities[index]->getType()) : -1; }
int GameManager::getEntitySubtype(int index) const { return index >= 0 && index < entities.size() ? entities[index]->getSubtype() : -1; }
float GameManager::getEntityX(int index) const { return index >= 0 && index < entities.size() ? entities[index]->getX() : 0.0f; }
float GameManager::getEntityY(int index) const { return index >= 0 && index < entities.size() ? entities[index]->getY() : 0.0f; }
float GameManager::getEntityWidth(int index) const { return index >= 0 && index < entities.size() ? entities[index]->getWidth() : 0.0f; }
float GameManager::getEntityHeight(int index) const { return index >= 0 && index < entities.size() ? entities[index]->getHeight() : 0.0f; }
bool GameManager::isEntityActive(int index) const { return index >= 0 && index < entities.size() ? entities[index]->isActive() : false; }`
  },
  {
    name: "bindings.cpp",
    path: "src/bindings.cpp",
    lang: 'cpp',
    code: `#include <emscripten/bind.h>
#include "GameManager.h"
#include "Entity.h"
#include "BuffManager.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(endless_runner_module) {
    class_<GameManager>("GameManager")
        .constructor<>()
        .function("init", &GameManager::init)
        .function("update", &GameManager::update)
        .function("handleJumpPress", &GameManager::handleJumpPress)
        .function("handleDuckPress", &GameManager::handleDuckPress)
        .function("getPlayerX", &GameManager::getPlayerX)
        .function("getPlayerY", &GameManager::getPlayerY)
        .function("getPlayerWidth", &GameManager::getPlayerWidth)
        .function("getPlayerHeight", &GameManager::getPlayerHeight)
        .function("isPlayerDucking", &GameManager::isPlayerDucking)
        .function("getScore", &GameManager::getScore)
        .function("getDistance", &GameManager::getDistance)
        .function("isGameOver", &GameManager::isGameOver)
        .function("getGameSpeed", &GameManager::getGameSpeed)
        .function("getBuffsMask", &GameManager::getBuffsMask)
        .function("getDebuffsMask", &GameManager::getDebuffsMask)
        .function("getBuffRemainingTime", &GameManager::getBuffRemainingTime)
        .function("getDebuffRemainingTime", &GameManager::getDebuffRemainingTime)
        .function("getEntityCount", &GameManager::getEntityCount)
        .function("getEntityType", &GameManager::getEntityType)
        .function("getEntitySubtype", &GameManager::getEntitySubtype)
        .function("getEntityX", &GameManager::getEntityX)
        .function("getEntityY", &GameManager::getEntityY)
        .function("getEntityWidth", &GameManager::getEntityWidth)
        .function("getEntityHeight", &GameManager::getEntityHeight)
        .function("isEntityActive", &GameManager::isEntityActive);
}`
  },
  {
    name: "game_ui.js",
    path: "public/game_ui.js",
    lang: 'js',
    code: `/**
 * Endless Runner Frontend Render Engine
 * Loads C++ GameManager bindings and hooks keyup/keydown controls.
 * Uses fallback memory simulation if native ASM load is pending.
 */
class GameViewport {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = canvas.getContext('2d');
        this.virtualWidth = 1000;
        this.virtualHeight = 500;
        this.particles = [];
        this.game = new window.Module.GameManager();
        this.lastTime = performance.now();
        this.setupListeners();
        requestAnimationFrame(this.tick.bind(this));
    }
    
    // ... complete vector particle physics logic and Web Audio synthesis
}`
  }
];
