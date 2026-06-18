#ifndef ENTITY_H
#define ENTITY_H

#include <string>

enum class EntityType {
    PLAYER,
    OBSTACLE,
    BUFF,
    DEBUFF
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
    int subtype; // Holds specific obstacle variety, buff/debuff types, etc.

public:
    Entity(float x, float y, float w, float h, EntityType type, int subtype);
    virtual ~Entity() = default;

    virtual void update(float dt);
    virtual bool checkCollision(const Entity& other) const;

    // Getters and Setters
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

    // Player physical status
    bool isGrounded() const { return grounded; }
    void setGrounded(bool state) { grounded = state; }

    bool isDucking() const { return ducking; }
    int getJumpsRemaining() const { return jumpsRemaining; }
    void setJumpsRemaining(int count) { jumpsRemaining = count; }
    
    float getBaseWidth() const { return baseWidth; }
    float getBaseHeight() const { return baseHeight; }
};

#endif // ENTITY_H
