#include "Entity.h"

// ==========================================
// Base Entity Implementation
// ==========================================

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

// ==========================================
// Player-specific Physics & Logic
// ==========================================

Player::Player(float x, float y, float w, float h)
    : Entity(x, y, w, h, EntityType::PLAYER, 0),
      grounded(true), ducking(false), jumpsRemaining(1), maxJumps(1),
      baseWidth(w), baseHeight(h) {}

void Player::update(float dt) {
    // Basic coordinate integration is typically synchronized with the GameManager gravity updates,
    // which handles variable gravity effects (Glide, Heavy Gravity) directly.
    x += vx * dt;
    y += vy * dt;
}

void Player::jump(bool doubleJumpEnabled, bool heavyGravity) {
    maxJumps = doubleJumpEnabled ? 2 : 1;
    
    // Check if player has jumps left
    if (grounded) {
        vy = heavyGravity ? -680.0f : -650.0f; // Extra kick for heavy gravity initial thrust
        grounded = false;
        jumpsRemaining = maxJumps - 1;
    } else if (doubleJumpEnabled && jumpsRemaining > 0) {
        vy = -550.0f; // Double jump gives a solid mid-air push
        jumpsRemaining--;
    }
}

void Player::setDucking(bool state, bool miniSize) {
    ducking = state;
    
    // Scale properties appropriately
    float targetHeight = baseHeight;
    float targetWidth = baseWidth;

    if (miniSize) {
        targetHeight *= 0.5f;
        targetWidth *= 0.5f;
    }

    if (ducking) {
        // Ducking widens slightly but drops height significantly
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
}
