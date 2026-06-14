<script>
import { Calendar, Kanban } from "lucide-svelte";
let clicked = $state(false);
function toggleClicked() {
	clicked = !clicked;
}
</script>
<div class="absolute left-1/2 transform -translate-x-1/2 z-999 top-4">
    <div class="flex items-center w-90 bg-ash rounded-full h-11 p-1">
        <button  class="flex items-center h-8 w-16 bg-haze rounded-full relative" onclick={toggleClicked}>
            <div class={"size-8  rounded-full bg-white absolute transition-all duration-300"+ (clicked ? " left-8" : " left-0")}></div>
            <div class="size-8 absolute flex justify-center items-center">
                <Calendar class="size-4 stroke-white" />
            </div>
            <div class="size-8 absolute right-0 flex justify-center items-center">
                <Kanban class="size-4 stroke-white" />
            </div>
        </button>
    </div>
</div>
