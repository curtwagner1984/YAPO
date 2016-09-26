import django
import os
from videos import const

django.setup()
from PIL import Image
from videos.models import Actor, Scene

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "YAPO.settings")


def process_items(objects, size):
    # scenes = Scene.objects.filter(websites__name__icontains="girlfriend")

    for item in objects:
        if item.thumbnail and item.thumbnail != const.UNKNOWN_PERSON_IMAGE_PATH :
            file, ext = os.path.splitext(item.thumbnail)
            print("ID: {} item '{}' File is '{}' and ext is '{}'".format(item.id, item.name, file, ext))
            print("Is file {}".format(os.path.isfile(item.thumbnail)))
            if os.path.isfile(item.thumbnail) and not os.path.isfile(file + ".jpg.{}".format(size[0])):
                im = Image.open(item.thumbnail)
                im.thumbnail(size)
                im.save(file + ".jpg.{}".format(size[0]), "JPEG")
            else:
                print("Converted file already exists ...")
        else:
            print("ID: {} item '{}' Has no thumbnail".format(item.id, item.name))


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

    #actor search and chips image

    actors = Actor.objects.all()
    size = 64, 128

    process_items(actors, size)


if __name__ == "__main__":
    main()
