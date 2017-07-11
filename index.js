const Command = require('command');

module.exports = function boxOpener(dispatch){
	const command = Command(dispatch)
	
	let	cid = null,
		enabled = false,
		location = null,
		timer = null,
		scanning = false;
		boxId = 166901, // MWA box as default.
		inventory = null;
		
	command.add('getbox', () => {
		scanning = true;
			command.message('Please open the box you wish to set.');
	});
	
	command.add('openbox', () => {
		if(!enabled){
			command.message('Opening selected box, use the same command to stop.');
			timer = setInterval(openBox,200)
		}
	});
	
	command.add('stopbox', () => {
		clearInterval(timer)
		enabled = false
		inventory = null
		command.message('Box opener stopped.')
	});
	
	dispatch.hook('S_LOGIN', 1, event =>{cid = event.cid});
	dispatch.hook('C_PLAYER_LOCATION', 1, event =>{location = event});
	
	dispatch.hook('S_INVEN', 4, event =>{ //Change this to 5 if EU
		if(!enabled) return

		if(event.first) inventory = []
		else if(!inventory) return

		for(let item of event.items) inventory.push(item)

		if(!event.more) {
			let box = false
		for(let item of inventory) {
				if(item.slot < 40) continue 
				if(item.item == boxId) box = true
		}
		if(!box) stop()

			inventory = null
		}
	});
	
	dispatch.hook('C_USE_ITEM', 1, event =>{
		if(!scanning) return
	
		if(scanning){
			boxId = event.item;
			command.message('Box set to: '+boxId+' If this is not a box try again.');
			scanning = false;
		}
	});
	
	function openBox() {
		dispatch.toServer('C_USE_ITEM', 1, {
			ownerId: cid,
			item: boxId,
			id: 0,
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1,
			unk5: 0,
			unk6: 0,
			unk7: 0,
			x: location.x1,
			y: location.y1,
			z: location.z1,
			w: location.w,
			unk8: 0,
			unk9: 0,
			unk10: 0,
			unk11: 1
		})
		
		dispatch.toServer('C_GACHA_TRY', 1,{
			id:385851
		})
	}
	function stop() {
		clearInterval(timer)
		enabled = false
		inventory = null
		command.message('Box opener stopped.')
		}
}
