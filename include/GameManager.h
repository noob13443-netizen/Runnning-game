#ifndef GAMEMANAGER_H
#define GAMEMANAGER_H

#include <vector>
#include "Entity.h"
#include "BuffManager.h"

// Define viewport constraints for our internal physics grid
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

    // Track input flags
    bool isJumpKeyPressed;
    bool isDuckKeyPressed;

    void spawnEntity();
    void cleanUpInactiveEntities();

public:
    GameManager();
    ~GameManager();

    void init();
    void update(float dt);

    // Player inputs
    void handleJumpPress(bool pressed);
    void handleDuckPress(bool pressed);

    // Dynamic triggers
    void triggerObstacleCollision(Entity* obstacle);
    void triggerBuffCollision(BuffType type);
    void triggerDebuffCollision(DebuffType type);

    // Game variables / Getters
    float getPlayerX() const { return player.getX(); }
    float getPlayerY() const { return player.getY(); }
    float getPlayerWidth() const { return player.getWidth(); }
    float getPlayerHeight() const { return player.getHeight(); }
    bool isPlayerDucking() const { return player.isDucking(); }

    int getScore() const { return static_cast<int>(score); }
    float getDistance() const { return distanceTravelled; }
    bool isGameOver() const { return gameOverState; }
    float getGameSpeed() const { return gameSpeed; }

    // Buffs and Debuffs state
    uint32_t getBuffsMask() const { return buffManager.getBuffBitmask(); }
    uint32_t getDebuffsMask() const { return buffManager.getDebuffBitmask(); }
    float getBuffRemainingTime(int type) const { return buffManager.getBuffRemaining(static_cast<BuffType>(type)); }
    float getDebuffRemainingTime(int type) const { return buffManager.getDebuffRemaining(static_cast<DebuffType>(type)); }

    // Active Entity rendering query methods
    int getEntityCount() const { return static_cast<int>(entities.size()); }
    int getEntityType(int index) const;
    int getEntitySubtype(int index) const;
    float getEntityX(int index) const;
    float getEntityY(int index) const;
    float getEntityWidth(int index) const;
    float getEntityHeight(int index) const;
    bool isEntityActive(int index) const;
};

#endif // GAMEMANAGER_H
