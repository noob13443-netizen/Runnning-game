#include "BuffManager.h"

BuffManager::BuffManager() {
    clearAll();
}

void BuffManager::update(float dt) {
    // Tick active positive buffs
    for (int i = 0; i < static_cast<int>(BuffType::COUNT); ++i) {
        BuffType type = static_cast<BuffType>(i);
        if (buffTimers[type] > 0.0f) {
            buffTimers[type] -= dt;
            if (buffTimers[type] < 0.0f) {
                buffTimers[type] = 0.0f;
            }
        }
    }

    // Tick active negative debuffs
    for (int i = 0; i < static_cast<int>(DebuffType::COUNT); ++i) {
        DebuffType type = static_cast<DebuffType>(i);
        if (debuffTimers[type] > 0.0f) {
            debuffTimers[type] -= dt;
            if (debuffTimers[type] < 0.0f) {
                debuffTimers[type] = 0.0f;
            }
        }
    }
}

void BuffManager::activateBuff(BuffType type, float duration) {
    // Shield might be discrete stacks, but standard duration refresh works beautifully.
    // If shield is activated, we standardly give it a generous timer or indefinite (duration = 999.0f)
    // until consumed. Here, we track by active presence!
    buffTimers[type] = duration;
}

bool BuffManager::isBuffActive(BuffType type) const {
    auto it = buffTimers.find(type);
    if (it != buffTimers.end()) {
        return it->second > 0.0f;
    }
    return false;
}

float BuffManager::getBuffRemaining(BuffType type) const {
    auto it = buffTimers.find(type);
    if (it != buffTimers.end()) {
        return it->second;
    }
    return 0.0f;
}

void BuffManager::removeBuff(BuffType type) {
    buffTimers[type] = 0.0f;
}

void BuffManager::activateDebuff(DebuffType type, float duration) {
    debuffTimers[type] = duration;
}

bool BuffManager::isDebuffActive(DebuffType type) const {
    auto it = debuffTimers.find(type);
    if (it != debuffTimers.end()) {
        return it->second > 0.0f;
    }
    return false;
}

float BuffManager::getDebuffRemaining(DebuffType type) const {
    auto it = debuffTimers.find(type);
    if (it != debuffTimers.end()) {
        return it->second;
    }
    return 0.0f;
}

void BuffManager::removeDebuff(DebuffType type) {
    debuffTimers[type] = 0.0f;
}

uint32_t BuffManager::getBuffBitmask() const {
    uint32_t mask = 0;
    for (int i = 0; i < static_cast<int>(BuffType::COUNT); ++i) {
        BuffType type = static_cast<BuffType>(i);
        if (isBuffActive(type)) {
            mask |= (1 << i);
        }
    }
    return mask;
}

uint32_t BuffManager::getDebuffBitmask() const {
    uint32_t mask = 0;
    for (int i = 0; i < static_cast<int>(DebuffType::COUNT); ++i) {
        DebuffType type = static_cast<DebuffType>(i);
        if (isDebuffActive(type)) {
            mask |= (1 << i);
        }
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
}
