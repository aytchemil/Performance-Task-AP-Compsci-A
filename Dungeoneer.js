var dungeons = [0, 1, 2];
var infiniteDungeonIndex = 2;
var EnemyLineUpCurrDungeon = [];
var DungeonLengths = [6, 6, 8]; //6, 6
var uiElements = ["button_bag", "img_equippedwpn", "button_attack", "button_block", "ui_background", "img_heart","text_health", "text_equipped_wpn"]
var selector = ["sel_up", "sel_down", "sel_left", "sel_right"];
var selStep1x = ["210", "210", "210", "302"]; var selStep1y = ["305", "435", "313", "313"];
var uiElementsRightSide = ["button_attack", "button_block"];
var selStepxChange = 98;
// 0 - Swordsman, 1 - Knifer
var mobEname = ["Cultist", "Slave", "Spirit", "Eye of Martyr"];
var mobImgs = ["mob_1.png", "mob_2.png", "mob_3.png", "mob_4.png"];
var mobHealths = [6, 4, 9, 5]; //6, 4, 9, 5
var mobBlockDurations = [2000, 1000, 1100, 320];
var mobDamageValues = [1, 1, 2, 2];
var mobAttackDelays = [900, 500, 650, 1300];
var mobThinkIntervals = [1500, 1400, 1000, 500];
var mobAttackChance = [60, 80, 95, 25]; //OUT OF 100
// 0 - The Prince's Guard
var bossEname = ["Guard", "Necromancer", "GOD"];
var bossImgs = ["boss_1.png", "mob_boss_2.png", "god.png"];
var bossHealths = [25, 20, 999] //18, 20
var bossBlockDurations = [2000, 200, 150];
var bossDamageValues = [2, 3, 100];
var bossAttackDelays = [550, 1000, 300];
var bossThinkIntervals = [500, 120, 200];
var bossAttackChance = [90, 18, 90]; //OUT OF 100
var activeEnemy = false;
var tutorialBattle = false;
var shortTimer = 1000; //5 seconds in miliseconds
var xposChange = 105;
var enemyStunned = false;
var deathanim = false;
var tutPassed = false;

//////INVENOTRY MANAGEMENT//////
var newItemQueue = [];
var bag = [];
var bagSlots = ["inv1", "inv2", "inv3", "inv4", "inv5", "inv6"];
var uiElementsBagUse = ["img_prev_item", "button_use", "text_itemdesc", "ui_prev_area", "text_equipped_bag", "button_unequip"];
var itemIds = [0, 1, 2, 3];
var itemName = ["Small Dagger", "Health Potion", "Broadsword", "Enchanted Sword"];
var itemDesc = ["A small dagger that deals minimal damage", "A medium health potion that can restore 4 hearts", "A larger, more damaging broadsword", "A sword enchanted by a special ritual to decay any flesh it touches"];
var itemImages = ["dagger.png", "potion.png", "broadsword.png", "enchantedsword.png"];
var weaponIds = [0, 2, 3];
var healthPotIncreases = [4];
var weaponDamages = [1, 2, 5];
var hasEquippedWeapon = false;
var currEquippedWpnId = [];
var enemyBlocking = false;
var playerBlocking = false;
var enemyAttacking = false;
var enemyUpdating = false;
var currEnemyHealth = 10;

var playerBlockTime = 1050;
var playerBlockTimout;
var playerAttacking = false;
var enemyBlockTimout;
var inBag = false;
var playerhp = 10;

//not turn based, player can block, no input queue

function stopEnemyBlocking(immediatly){
  if(immediatly == true){
    if(enemyBlockTimout != null){
      clearTimeout(enemyBlockTimout);
    }
    enemyBlocking = false;
    setProperty("img_block_en", "hidden", true);
  }else{
    setTimeout(function(){ //VISUAL BLOCK INDICATION 
      clearTimeout(enemyBlockTimout);
      enemyBlocking = false;
      setProperty("img_block_en", "hidden", true);
    }, 100);
  }
}

function PlayerAttack(){
  if(playerAttacking == false){
    if(playerBlockTimout != null){
      clearTimeout(playerBlockTimout);
    }
    playerBlocking = false;
    setProperty("img_block_player", "hidden", true);
    if(enemyBlocking == true){
      hitEnemy(false);
      enemyAttacking = false;
      stopEnemyBlocking(false);
      EnemyAttack(findIndexOf(mobEname, EnemyLineUpCurrDungeon[0]), 100, 2);
    }
    else
    {
      hitEnemy(true);
    }
  }
  
}


function playerDie(){ //RESET EVERYTHING
  console.log("PLAYER IS DEAD PLAYER IS DEAD PLAYER IS DEAD PLAYER IS DEAD PLAYER IS DEAD PLAYER IS DEAD ")
  dungeons = [0, 1, 2];
  DungeonLengths = [6, 8, 1];
  EnemyLineUpCurrDungeon = [];
  activeEnemy = false;
  tutorialBattle = false;
  enemyStunned = false;
  deathanim = false;
  newItemQueue = [];
  bag = [];
  hasEquippedWeapon = false;
  currEquippedWpnId = [];
  enemyBlocking = false;
  playerBlocking = false;
  enemyAttacking = false;
  enemyUpdating = false;
  playerAttacking = false;
  inBag = false;
  setProperty("button_restart", "hidden", false);
}

onEvent("button_restart", "click", function(){
  setScreen("scr_menu");
  setProperty("button_restart", "hidden", true);
});

function playerTakeDamage(damage){
  setProperty("img_player_bleed", "hidden", false);
  setProperty("text_health", "text", getProperty("text_health", "text") - damage);
  setTimeout(function(){
    setProperty("img_player_bleed", "hidden", true);  
  }, 300); //BLEED INDICATOR TIME ON SCREEN
  
  if(getProperty("text_health", "text") <= 0){
    playerDie();
  }
}

function EnemyDie(){
  activeEnemy = false;
  playerBlocking = true;
  enemyBlocking = false;
  var currAnimFinishedNum = 0;
  var deadEnemy = EnemyLineUpCurrDungeon[0];
  removeItem(EnemyLineUpCurrDungeon, 0);
  console.log("before death lenght is " + (EnemyLineUpCurrDungeon.length));
  console.log(" ++++++++ enemy die +++++++++")
  console.log("spawning next enemy " + EnemyLineUpCurrDungeon[0] + " from list : " +  EnemyLineUpCurrDungeon + " after removing prev enemy");
  if(enemyUpdating != null){
    clearInterval(enemyUpdating);
  }
  if(enemyBlockTimout != null){
    clearInterval(enemyBlockTimout);
  }
  var chanceToReceiveHealth = 30;
  var oldx = getProperty("img_enemy", "x");
  var oldy = getProperty("img_enemy", "y");
  deathanim = true;
    deathAnimation = setInterval(function(){
      currAnimFinishedNum += 50;
      setProperty("ui_blocker2", "hidden", false);
      var x = getProperty("img_enemy", "x");
      var y = getProperty("img_enemy", "y");
      setPosition("img_enemy", x, y+5, getProperty("img_enemy", "width"), getProperty("img_enemy", "height"))
      if(currAnimFinishedNum >= 1000){
        clearInterval(deathAnimation);
        playerBlocking = false;
        deathanim = false;
        setProperty("ui_blocker2", "hidden", true);
        setPosition("img_enemy", oldx, oldy, getProperty("img_enemy", "width"), getProperty("img_enemy", "height"))
        if(EnemyLineUpCurrDungeon.length > 0){
          console.log(" ++++++++ enemy die +++++++++")
          console.log("line up length is " + (EnemyLineUpCurrDungeon.length-1));
          console.log("spawning next enemy " + EnemyLineUpCurrDungeon[0] + " from list : " +  EnemyLineUpCurrDungeon);
          SpawnNextEnemy();
        }else{
          clearInterval(BossUpdating);
          if(dungeons.length > 0){
            NextDungeon();
          }
        } 
      }
  }, 50)
}

function NextDungeon(){
  removeItem(dungeons, 0);
  removeItem(DungeonLengths, [0]);
  console.log("new duneon initiated! dungeon : " + dungeons[0]);
  removeAnyEnemy();
  GenerateEnemyLineUp(DungeonLengths[0], dungeons[0]);
  if(dungeons[0] == infiniteDungeonIndex){
    SpawnLoot(2);
  }else{
    SpawnLoot(1);
  }
}

function hitEnemy(hit){
  playerAttacking = true;
  setProperty("img_hit_en", "hidden", false);
  var initialhit = setTimeout(function(){
    if(hit == true){
      setProperty("img_hit_en", "image", "bloodpng.png");
      var weaponIdIndex = findIndexOf(weaponIds, currEquippedWpnId[0]);
      console.log("Original enemy health is " + currEnemyHealth);
      currEnemyHealth -= weaponDamages[weaponIdIndex];
      console.log(" ============================ enemy take damange, new health is " + currEnemyHealth);
      if(currEnemyHealth <= 0){
        EnemyDie();
      }
    }
    setTimeout(function(){
        setProperty("img_hit_en", "hidden", true);
        setProperty("img_hit_en", "image", "slashpng.png");
        playerAttacking = false;
    }, 300);
  }, 200);
}

//
//
//   MAKE ENENMY ATTACK HAVE AN INPUT FOR DAMAGE SO DAMAGE FOR BOSSES CAN BE P
//
//
//
//
//

function EnemyAttack(id, givenDelay, damage){
  stopEnemyBlocking(true);
  if(inBag == false && enemyAttacking == false){
    enemyAttacking = true;
    setProperty("img_att_inc", "hidden", false);
    console.log("is player blocking? : " + playerBlocking);

    setTimeout(function(){
      setProperty("img_att_inc", "hidden", true);
      if(playerBlocking == false){
      playerTakeDamage(damage);
      }
      else 
      {
        enemyStunned = true;
        setTimeout(function(){
          enemyStunned = false;
        }, 300)
      }   
      enemyAttacking = false;
  }, givenDelay);
  
  }
}

function EnemyUpdate(id, ismob){
  if(ismob == true){
  console.log("enemy starting to update");
   enemyUpdating = setInterval(function(){
    if(activeEnemy == true){
      var attNum = randomNumber(0, 100);
      if(enemyBlocking == false && enemyStunned == false){
        console.log("enemy thinking attack chance : " + mobAttackChance[id] + " | num is : " + attNum);
        if(attNum < mobAttackChance[id]){
          //attacking chance
          console.log("enemy attacking | dmg : " + mobDamageValues[id]);
          EnemyAttack(id, mobAttackDelays[id], mobDamageValues[id]);
          
        }else{
          //defending chance
        console.log("enemy defeinding");
          if(enemyAttacking == false){
            enemyBlocking = true;
            setProperty("img_block_en", "hidden", false);
            console.log("block duration of : " + mobBlockDurations[id] + " : to id : " + id);
            enemyBlockTimout = setTimeout(function(){
              enemyBlocking = false;
              setProperty("img_block_en", "hidden", true);
            }, mobBlockDurations[id]);
          }

          
        }
      }
    }
  }, mobThinkIntervals[id]);
}else{                               ///BOSS BOSS BOSS UPDATE
  clearInterval(enemyUpdating);
  console.log("boss starting to update");
   BossUpdating = setInterval(function(){
    if(activeEnemy == true){
      var attNum = randomNumber(0, 100);
      if(enemyBlocking == false && enemyStunned == false){
        console.log("BOSS thinking attack chance : " + bossAttackChance[id] + " | num is : " + attNum);
        if(attNum < bossAttackChance[id]){
        //attacking chance
        console.log("BOSS attacking | dmg : " + bossDamageValues[id]);
        EnemyAttack(id, bossAttackDelays[id], bossDamageValues[id]);
        
        }else{
          //defending chance
        console.log("BOSS defeinding");
        if(enemyAttacking == false){
          enemyBlocking = true;
          setProperty("img_block_en", "hidden", false);
          enemyBlockTimout = setTimeout(function(){
            enemyBlocking = false;
            setProperty("img_block_en", "hidden", true);
          }, bossBlockDurations[id]);
        }

        }
      }
      
    }
  }, bossThinkIntervals[id]);
  
}

}


function StartGame(){
  setProperty("text_health", "text", playerhp);
  DungeonLengths[infiniteDungeonIndex] = 100; //100
  currDungeon = 0;
  removeAnyEnemy();
  SpawnLoot(0);
  if(tutPassed == false){
    tutorialBattle = true;
  }else{
    setProperty("img_equippedwpn", "image", "empty.png");
    setProperty("text_equipped_wpn", "text", "");
  }
  GenerateEnemyLineUp(DungeonLengths[0], 0);
}

function findIndexOf(list, item){
  for(var i = 0; i < list.length; i++){
    console.log("index of list : " + list);
    console.log("checking : " + item);
    if(list[i] == item){
      console.log("found index : " + i);
      return i;
    }
  }
}

function SpawnNextEnemy(){
  console.log("SPAWNING NEXT ENMYYYYY");
  var ismob = true;
  if(tutorialBattle == false){ console.log("not first enemy");}
  var name = EnemyLineUpCurrDungeon[0];
  console.log("name of spawning enemy is : " + name);
  console.log("Finding " + name + " in list : " + mobEname);
  var id = findIndexOf(mobEname, name);
  console.log(name + "'s index is : " + id);
  if(id == undefined){
    console.log("UNDEFINED IN MOB VALUES, IS THEREFOREA BOSS");
    id = findIndexOf(bossEname, name);
    ismob=false;
  }
  if(ismob == true){
    console.log("new spawned enemy id is " + id);
    console.log("spawning enemy");
    
    console.log("searching list mobEname: " + mobEname +  " | using index : " + name);
    setText("lbl_enemy", name);
    
    console.log(mobImgs + " with index  " + id);
    console.log("new mob img is " + mobImgs[id]);
    setProperty("img_enemy", "image", mobImgs[id]);
    
    activeEnemy = true;
    currEnemyHealth = mobHealths[id];
    if(tutorialBattle == false)
    {
      console.log("starting updates on mob");
      EnemyUpdate(id, true);
    }
    return;
  }else{  /////// BOSSS SPAWNNN ///////////
    console.log("spawning boss " + id);
    
    console.log("current linup: " + bossEname +  " | using index : " + name);
    setText("lbl_enemy", name);
    
    console.log(bossImgs + " with index  " + id);
    console.log("new boss img is " + bossImgs[id]);
    setProperty("img_enemy", "image", bossImgs[id]);
    
    activeEnemy = true;
    currEnemyHealth = bossHealths[id];
    console.log("Starting updates on Boss");
    EnemyUpdate(id, false);
    return;
  }

}

function GenerateEnemyLineUp(chosenDungLength, dungeonNum){
  console.log("Generating curr dungeon enemies with length of " + chosenDungLength);
  if(tutorialBattle == true)
  {
    appendItem(EnemyLineUpCurrDungeon, mobEname[0]);
    for(var i = 0; i < chosenDungLength-1; i++)
    {
      appendItem(EnemyLineUpCurrDungeon, mobEname[randomNumber(0, 1)]);
    }
    appendItem(EnemyLineUpCurrDungeon, bossEname[dungeons[0]]);
    console.log("length : " + chosenDungLength + " | list : " + EnemyLineUpCurrDungeon);
  }
  else /////////////////// NOT TUTRIAL BATTLE
  {
    if(dungeonNum != infiniteDungeonIndex){
      console.log(chosenDungLength);
      var minVal; var maxVal;
      switch(dungeonNum){
        case 0: 
          minVal = 0; maxVal = 1; break;
        case 1:
          minVal = 2; maxVal = 3; break;
      }
      console.log(" min val is : " + minVal);
      console.log(" max val is : " + maxVal);
      for(var i = 0; i < chosenDungLength; i++){
        var generatedEnemyId = randomNumber(minVal, maxVal);
        appendItem(EnemyLineUpCurrDungeon, mobEname[generatedEnemyId]);
        console.log("added new enemy " + generatedEnemyId + " to the generated Enemy list");
      }
      appendItem(EnemyLineUpCurrDungeon, bossEname[dungeons[0]]);
      console.log("curr dungeon en : " + EnemyLineUpCurrDungeon);
    }else{
      
      for(var i = 0; i < chosenDungLength; i++){
        var chancetospawnBoss = 20;
        if(randomNumber(0, 100) > chancetospawnBoss){ //spawn mob
          var generatedEnemyId = randomNumber(0, mobEname.length-1);
          appendItem(EnemyLineUpCurrDungeon, mobEname[generatedEnemyId]);
          console.log("added new enemy " + generatedEnemyId + " to the generated Enemy list");
        }else{ //spawn boss
          var generatedEnemyId = randomNumber(0, 1);
          appendItem(EnemyLineUpCurrDungeon, bossEname[generatedEnemyId]);
        }
      }
      appendItem(EnemyLineUpCurrDungeon, bossEname[2]);
    }
  }
}

function playerBlock(){
  playerBlocking = true;
  setProperty("img_block_player", "hidden", false);
  playerBlockTimout = setTimeout(function(){
      playerBlocking = false;
      setProperty("img_block_player", "hidden", true);
  }, playerBlockTime);
  
}


onEvent("button_attack", "click", function(){ if(tutorialBattle == true){ console.log("attack input");  tutStep(2);}else
  {
    console.log("attack input"); if(hasEquippedWeapon == true){ PlayerAttack();}
    
  }
});

onEvent("button_block", "click", function(){ if(tutorialBattle == true){ console.log("block input"); tutStep(2);}else
  {
    console.log("block input"); if(playerBlocking == false){ playerBlock();}
  }
});
onEvent("button_bag", "click", function(){ if(tutorialBattle == true){ console.log("bag input"); tutStep(4);}else
  {
    console.log("bag input");
    console.log(bag)
    OpenBag();
  }
});
onEvent("button_closebag", "click", function(){
  CloseBag();
});
onEvent("button_use", "click", function(){ ///USE BUTTTTONNNNNNNNNnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
  console.log("use button clicked");
  for(var i = 0; i < weaponIds.length; i++){
    console.log("checking if its a weapon");
    //get index of item, in itemimages, check it to if its in weaponids
    var itemIndex = findIndexOf(itemImages, getProperty("img_prev_item", "image"));
    console.log("potentially equipping id : " + itemIndex + " if == " + weaponIds[i]);
    if(itemIndex == weaponIds[i]){ //its a weapon
      console.log("is equal, equpping from list of wpns : " +  weaponIds);
      console.log("its a weapon");
      EquipWeapon(weaponIds[i]);
      return;
    }else{
      console.log("is not equal");
    }
  }
  if(findIndexOf(itemImages, getProperty("img_prev_item", "image")) == 1){ //its a health small health pot
    setProperty("text_health", "text", getNumber("text_health","text") + healthPotIncreases[0]);
    for(var i = 0; i < bagSlots.length; i++){
      console.log(bagSlots);
      console.log(bagSlots[i], "image");
      if(getProperty(bagSlots[i], "image") == itemImages[1]){
        setProperty(bagSlots[i], "image", "empty.png");
        EnableUseUi(false);
        removeItem(bag, i);
        OpenBag();
      }
    }
  } 
});

onEvent("button_unequip", "click", function(){
  UnEquipWeapon();
});

function UnEquipWeapon(){
  console.log("un equipping weapon");
  setProperty("img_equippedwpn", "image", "empty.png");
  setProperty("text_equipped_wpn", "text", "");
  hasEquippedWeapon = false;
  currEquippedWpnId = [];
  setProperty("button_unequip", "hidden", true);
}

function EquipWeapon(id){
  console.log("equiping weapon id of : "  + id);
  setProperty("img_equippedwpn", "image", itemImages[id]);
  setProperty("text_equipped_wpn", "text", itemName[id]);
  hasEquippedWeapon = true;
  currEquippedWpnId[0] = id;
  setProperty("button_unequip", "hidden", false);
}

onEvent("inv1", "click", function(){bagPressed(1);}); onEvent("inv2", "click", function(){bagPressed(2);}); 
onEvent("inv3", "click", function(){bagPressed(3);}); onEvent("inv4", "click", function(){bagPressed(4);}); 
onEvent("inv5", "click", function(){bagPressed(5);}); onEvent("inv6", "click", function(){bagPressed(6);}); 

function bagPressed(slotnum){
  EnableUseUi(true);
  //slot 1 is of bag[0]   //in bag[any index] IS THE STORED ID of that item
  if(bag[slotnum-1] != null){
    setProperty("img_prev_item", "image", itemImages[bag[slotnum-1]]);
    setProperty("text_itemdesc", "text", itemDesc[bag[slotnum-1]]);  
    setProperty("text_equipped_bag", "text", itemName[bag[slotnum-1]]);
    if(hasEquippedWeapon == true){
      if(getProperty("img_equippedwpn", "image") == itemImages[bag[slotnum-1]]){ //if the selected weapon in bag is the one equipped
        setProperty("button_unequip", "hidden", false);
      }
    }else{
      setProperty("button_unequip", "hidden", true);
    }
  }else{
    EnableUseUi(false);
  }
}
  
function EnableUseUi(enable){
  if(enable == true){
    console.log("enabling use ui");
    for(var i = 0; i < uiElementsBagUse.length; i++){
      setProperty(uiElementsBagUse[i], "hidden", false);
    }
    setProperty("button_unequip", "hidden", true);
  }else{
    console.log("disabling use ui");
    for(var i = 0; i < uiElementsBagUse.length; i++){
      setProperty(uiElementsBagUse[i], "hidden", true);
    } 
    setProperty("button_unequip", "hidden", true);
  }
}
function OpenBag(){
  inBag = true;
  setScreen("scr_bag");
  EnableUseUi(false);
  if(hasEquippedWeapon == false){
    setProperty("text_equipped_wpn", "text", "");
  }
  
  
  //not initial
  for(var i = 0; i < bagSlots.length; i++){ //go through every bag Slot (inv slot)
    if(bag[i] != null){ //if its corosponing held Item IS THERE
      setProperty(bagSlots[i], "image", itemImages[bag[i]]); //Enable it
    }else{
      setProperty(bagSlots[i], "image","empty.png");
    }
  }
}
function CloseBag(){
  inBag = false;
  if(tutorialBattle == true){
    tutorialBattle = false;
    var id = findIndexOf(mobEname, EnemyLineUpCurrDungeon[0]);
    EnemyUpdate(id, true);
  }
    setScreen("scr_game");
}
function tutStep(stepnum){
  console.log("in tut, stepnum is " + stepnum);
  switch(stepnum){
    case (stepnum = 1): 
      console.log("tut step 1, Rightside input buttons");
      if(activeEnemy == true){
        console.log("tut");
        SelectorEnable(true);
        setProperty("ui_blocker1", "hidden", false);
        setProperty("ui_blocker2", "hidden", true);
        setProperty("tut_input_right", "hidden", false);
        setProperty("tut_input_mid", "hidden", true);   
        setProperty("tut_input_left", "hidden", true);              
        for(var i = 0; i < selector.length; i++){
          setProperty(selector[i], "x", 215);
        } setProperty("sel_right", "x", 305); setProperty("sel_left", "x", 210);
        setProperty("sel_down", "y", 435);}break;
   case (stepnum = 2): console.log("tut step 2, Health and Weapon");
      if(activeEnemy == true){
        for(var i = 0; i < selector.length; i++){
          setProperty(selector[i], "x", getProperty(selector[i], "x") - xposChange);
        }
        setProperty("ui_blocker1", "x", getProperty("ui_blocker1", "x") - xposChange);
        setProperty("ui_blocker2", "hidden", false);     
        //
        setProperty("tut_input_right", "hidden", true);
        setProperty("tut_input_mid", "hidden", false);
        setProperty("tut_input_left", "hidden", true);            
        setTimeout(function(){
          tutStep(3);
        }, shortTimer);}break;
   case (stepnum = 3): console.log("tut step 3, bag");
      if(activeEnemy == true){
        console.log("setting tut 3");
        for(var i = 0; i < selector.length; i++){
          setProperty(selector[i], "x", getProperty(selector[i], "x") - xposChange);
        }
        setProperty("tut_input_right", "hidden", true);
        setProperty("tut_input_mid", "hidden", true);
        setProperty("tut_input_left", "hidden", false);     
        setProperty("ui_blocker1", "x", getProperty("ui_blocker1", "x") + (xposChange * 2));  
        setProperty("ui_blocker2", "hidden", false);
      }break;
   case (stepnum = 4): console.log("tut step 4, going into bag");
      if(activeEnemy == true){
        console.log("setting tut 4");
        for(var i = 0; i < selector.length; i++){
          setProperty(selector[i], "hidden", true);
        }
        setProperty("tut_input_right", "hidden", true);
        setProperty("tut_input_mid", "hidden", true);
        setProperty("tut_input_left", "hidden", true);
        setProperty("ui_blocker1", "hidden", true);
        setProperty("ui_blocker2", "hidden", true);
        console.log(bag)
        tutPassed = true;
        OpenBag();
      }
        
      
  }  
}


onEvent("button_startgame", "click", function() {
  setScreen("scr_game");
  StartGame();
});
onEvent("button_openloot", "click", function(){
  TakeUiEnable(true);
});
onEvent("button_takenewitem", "click", function(){
  TakeLoot();
  TakeUiEnable(false);
  SpawnNextEnemy();
  if(tutorialBattle == true){
    tutStep(1);
  }
  inBag = false;
});

function UiElementsEnable(enable){
  if(enable == true){
    for(var i = 0; i < uiElements.length; i++){
      setProperty(uiElements[i], "hidden", false);
    }
  }
  else if(enable == false)
  {
    for(var i = 0; i < uiElements.length; i++){
      setProperty(uiElements[i], "hidden", true);
    }
  }

}
function SelectorEnable(enable){
  if(enable == true){
    for(var i = 0; i < selector.length; i++){
      setProperty(selector[i], "hidden", false);
    }
  }
  else if(enable == false)
  {
    for(var i = 0; i < selector.length; i++){
      setProperty(selector[i], "hidden", true);
    }
  }

}
function TakeLoot(){
  appendItem(bag, newItemQueue[0]);
  console.log("taking loot id : " + newItemQueue[0]);
  console.log("current bag is : " + bag);
  removeItem(newItemQueue, 0);
  console.log("taken loot, current queue is : " + newItemQueue);
  UiElementsEnable(true);
  
}

function TakeUiEnable(enable){
  if(enable == true){
    setProperty("lbl_newitem", "hidden", false);
    setProperty("ui_newitem", "hidden", false);
    setProperty("img_newitem", "hidden", false);
    setProperty("button_takenewitem", "hidden", false);
    setProperty("button_openloot", "hidden", true);
    setProperty("scr_game", "image", "background2.png");
  }else{
    setProperty("lbl_newitem", "hidden", true);
    setProperty("ui_newitem", "hidden", true);
    setProperty("img_newitem", "hidden", true);
    setProperty("button_takenewitem", "hidden", true);
    setProperty("button_openloot", "hidden", true); 
    setProperty("scr_game", "image", "background1.png");
  }

}
function SpawnLoot(itemid){
  console.log("spawning loot ! ! ! of id : " + itemid)
  inBag = true;
  UiElementsEnable(false);
  setProperty("button_openloot", "hidden", false);
  setProperty("scr_game", "image","bg3.png");
  setProperty("img_att_inc", "hidden", true);
  setProperty("img_block_en", "hidden", true);
  setProperty("img_block_player", "hidden", true);
  setProperty("img_hit_en", "hidden", true);
  setProperty("img_player_bleed", "hidden", true);
  appendItem(newItemQueue, itemIds[itemid]);
  console.log("taking in new item in queue of " + newItemQueue[0]);
  setProperty("img_newitem", "image", itemImages[newItemQueue[0]]);
  console.log("current queue is : " + newItemQueue);
}
function removeAnyEnemy(){
  setImageURL("img_enemy", "");
  setText("lbl_enemy", "");
  setText("lbl_dungeon", "DUNGEON: " + dungeons[0]);
}
  setScreen("scr_menu");
