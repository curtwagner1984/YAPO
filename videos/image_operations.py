import django
import os
from videos import const

django.setup()
from PIL import Image
from videos.models import Actor, Scene

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "YAPO.settings")


def process_all_scenes(force):
    scenes = Scene.objects.all()
    size = 360, 203
    process_items(scenes, size, force)


def process_single_scene(scene,force):
    size = 360, 203
    process_item(scene, size, force)


def process_single_actor_grid(actor,force):
    size = 256, 512
    process_item(actor, size,force)


def process_single_actor_contact(actor, force):
    size = 64, 128
    process_item(actor, size, force)


def process_all_actors_grid(force):
    actors = Actor.objects.all()

    for actor in actors:
        process_single_actor_grid(actor,force)


def process_all_actors_contact(force):
    actors = Actor.objects.all()

    for actor in actors:
        process_single_actor_contact(actor,force)


def process_item(item, size, force):
    dir_path = os.path.dirname(os.path.realpath(__file__))
    if item.thumbnail and item.thumbnail != const.UNKNOWN_PERSON_IMAGE_PATH:
        img_path = os.path.join(dir_path, item.thumbnail)
        img_path = os.path.abspath(img_path)
        file, ext = os.path.splitext(img_path)
        print("ID: {} item '{}' File is '{}' and ext is '{}'".format(item.id, item.name, file, ext))
        print("Is file {}".format(os.path.isfile(img_path)))
        if (os.path.isfile(img_path) and not os.path.isfile(file + ".jpg.{}".format(size[0]))) or (
            os.path.isfile(img_path) and force):
            im = Image.open(img_path)
            im.thumbnail(size)
            im.save(file + ".jpg.{}".format(size[0]), "JPEG")
        else:
            print("Converted file already exists ...")
    else:
        print("ID: {} item '{}' Has no thumbnail".format(item.id, item.name))


def process_items(objects, size,force):
    # scenes = Scene.objects.filter(websites__name__icontains="girlfriend")

    for item in objects:
        process_item(item, size,force)


def main():
    # Scenes gridview and list image size
    # scenes = Scene.objects.all()
    # size = 360, 203

    # process_items(scenes,size)

    # actor list and gridview size
    # actors = Actor.objects.all()
    # size = 256, 512
    #
    # process_items(actors,size)

    # actor search and chips image

    actors = Actor.objects.all()
    size = 64, 128

    process_items(actors, size,False)


if __name__ == "__main__":
    main()
