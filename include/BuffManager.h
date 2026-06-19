#ifndef BUFFMANAGER_H
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
    COUNT = 6
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
    
    // Positive Buff control
    void activateBuff(BuffType type, float duration);
    bool isBuffActive(BuffType type) const;
    float getBuffRemaining(BuffType type) const;
    void removeBuff(BuffType type);

    // Negative Debuff control
    void activateDebuff(DebuffType type, float duration);
    bool isDebuffActive(DebuffType type) const;
    float getDebuffRemaining(DebuffType type) const;
    void removeDebuff(DebuffType type);

    // Dynamic bitmasks (ideal for fast queries/WASM JS interop)
    uint32_t getBuffBitmask() const;
    uint32_t getDebuffBitmask() const;

    void clearAll();
};

#endif // BUFFMANAGER_H
