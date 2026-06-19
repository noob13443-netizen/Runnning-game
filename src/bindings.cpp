#include <emscripten/bind.h>
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
}
